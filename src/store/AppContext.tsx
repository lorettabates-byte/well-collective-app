import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  CATEGORIES,
  CURRENT_USER,
  EVENTS,
  INSPIRATIONS,
  NOTIFICATIONS,
  THREADS,
} from "../data/mockData";
import { getFallbackRecipe } from "../data/nutritionLibrary";
import type { WorkoutPlan } from "../data/workoutLibrary";
import { getFallbackWellActivity } from "../data/wellnessLibrary";
import { getRecipePhoto, getRecipePhotoByCategory } from "../utils/recipePhotos";
import type { BadgeHolder } from "../data/badges";

interface MemberDirectoryEntry extends BadgeHolder {
  name?: string;
  avatar?: string;
}
import type {
  AppNotification,
  AppNotificationType,
  CommunityEvent,
  ContentBatchEntry,
  ForumCategory,
  ForumThread,
  Inspiration,
  NotificationSettings,
  Recipe,
  RecipeFolder,
  SavedRecipe,
  ThreadMessage,
  User,
  WellActivity,
} from "../types";

const STORAGE_KEY = "well-collective-state-v1";

// Emails that should have admin access to the app
const ADMIN_EMAILS = new Set([
  "loretta@lorettabates.com",
  "lorettabates@gmail.com",
]);

// Attempt to free up localStorage quota when it's exceeded.
// First tries clearing large items (cached threads, inspirations), then clears everything.
function recoverFromQuotaExceeded() {
  try {
    // Try removing large cached content first
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }

    // Remove other app data, but preserve user preferences and flags
    const keysToPreserve = [
      "memberUser",
      "memberProfileSyncedEmail",
      "well-notifications-onboarding-v1",
      "well-feature-tour-v1",
      "memberTrialEndsAt",
    ];
    for (const key of keys) {
      if (key && !key.startsWith("well-collective") && !keysToPreserve.includes(key)) {
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
      }
    }

    // If still over quota, clear and reload
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length > 3 * 1024 * 1024) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem("_recovered_from_quota_error", "true");
      window.location.reload();
      return true;
    }
  } catch {
    // If recovery fails, just return false
  }
  return false;
}

interface PersistedState {
  user: User;
  categories: ForumCategory[];
  threads: ForumThread[];
  inspirations: Inspiration[];
  events: CommunityEvent[];
  notifications: AppNotification[];
  notificationSettings: NotificationSettings;
  contentSchedule: ContentBatchEntry[];
  processedDates: string[];
  featuredEventId: string | null;
  // Watermark for the forum-activity-to-bell-notification reconciliation
  // below — only posts/replies newer than this become notifications, so a
  // device that's never seen this feature before doesn't get flooded with
  // months of forum history the first time it polls. Null until the first
  // poll establishes a baseline.
  lastForumNotifiedAt: string | null;
}

const DEFAULT_STATE: PersistedState = {
  user: CURRENT_USER,
  categories: CATEGORIES,
  threads: THREADS,
  inspirations: INSPIRATIONS,
  events: EVENTS,
  notifications: NOTIFICATIONS,
  notificationSettings: {
    community: true,
    replies: true,
    mentions: true,
    general: true,
    weeklyTheme: true,
    dailyInspiration: true,
    newEvents: true,
    newBlogs: true,
    pushEnabled: false,
  },
  contentSchedule: [],
  processedDates: [],
  featuredEventId: null,
  lastForumNotifiedAt: null,
};

// Every real member must have a unique, stable id derived from their email —
// without this, every member's likes/RSVPs/message authorship would be
// attributed to the same shared mock id ("u1"), making them indistinguishable
// from each other (e.g. one member's like would show as already-liked for
// everyone else too).
function deriveMemberId(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash |= 0;
  }
  return `m_${Math.abs(hash).toString(36)}`;
}

function applyMemberInfo(user: User): User {
  try {
    const raw = window.localStorage.getItem("memberUser");
    if (!raw) return user;
    const member = JSON.parse(raw) as { email?: string; name?: string };
    const trialEndsAt = window.localStorage.getItem("memberTrialEndsAt");

    const memberEmail = member.email?.toLowerCase();
    const syncedEmail = window.localStorage.getItem("memberProfileSyncedEmail")?.toLowerCase();
    const isNewMember = !!memberEmail && memberEmail !== syncedEmail;
    if (member.email) {
      window.localStorage.setItem("memberProfileSyncedEmail", member.email);
    }

    const isAdmin = memberEmail && ADMIN_EMAILS.has(memberEmail);

    return {
      ...user,
      ...(isAdmin
        ? {
            isAdmin: true,
          }
        : isNewMember
          // Only seed name/avatar/bio/birthday from the WP account on first
          // sync for this email — once synced, the user's own edits in
          // Edit Profile are authoritative and must not be overwritten on
          // every load. Fall back to whatever is already in local state
          // rather than blanking it out, so a false-positive "new member"
          // detection (e.g. a Safari storage-partition quirk) can never
          // destroy already-saved profile data.
          ? {
              avatar: user.avatar || "",
              bio: user.bio || "",
              birthday: user.birthday || undefined,
              isAdmin: false,
              // user.name starts as the literal "Member" placeholder
              // (CURRENT_USER's default) until a real member overwrites it —
              // treat that placeholder the same as blank so a stale
              // "new member" re-detection (e.g. after logout/login resets
              // memberProfileSyncedEmail) can't clobber a name the member
              // has actually already customized in Edit Profile.
              name: user.name && user.name !== CURRENT_USER.name ? user.name : member.name || user.name,
            }
          : {}),
      id: memberEmail ? deriveMemberId(memberEmail) : user.id,
      email: member.email || user.email,
      // Read fresh from localStorage only — falling back to the previously
      // cached user.trialEndsAt would resurrect a stale trial date forever
      // (e.g. for a real member whose old trial flag was never cleared).
      trialEndsAt: trialEndsAt || undefined,
    };
  } catch {
    return user;
  }
}

// One-time cleanup for devices that already persisted the old seed
// notifications (n1/n2/n4) before the baseline was replaced with the real
// "Just a little reminder" note and "Welcome" post. Runs harmlessly forever
// since the legacy ids disappear after the first migration.
const LEGACY_SEED_IDS = ["n1", "n2", "n4"];
function migrateLegacyNotifications(notifications: AppNotification[]): AppNotification[] {
  const hasLegacy = notifications.some((n) => LEGACY_SEED_IDS.includes(n.id));
  if (!hasLegacy) return notifications;
  const cleaned = notifications.filter((n) => !LEGACY_SEED_IDS.includes(n.id));
  const baseline = NOTIFICATIONS.filter(
    (n) => n.id !== "n3" && !cleaned.some((existing) => existing.id === n.id)
  );
  return [...baseline, ...cleaned];
}

function loadState(): PersistedState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, user: applyMemberInfo(DEFAULT_STATE.user) };
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const loadedUser = applyMemberInfo(parsed.user ?? DEFAULT_STATE.user);

    return {
      user: loadedUser,
      // Always load fresh from API — don't cache collections in localStorage
      categories: DEFAULT_STATE.categories,
      threads: DEFAULT_STATE.threads,
      inspirations: DEFAULT_STATE.inspirations,
      events: DEFAULT_STATE.events,
      notifications: migrateLegacyNotifications(parsed.notifications ?? DEFAULT_STATE.notifications),
      notificationSettings: {
        ...DEFAULT_STATE.notificationSettings,
        ...parsed.notificationSettings,
      },
      contentSchedule: DEFAULT_STATE.contentSchedule,
      processedDates: parsed.processedDates ?? DEFAULT_STATE.processedDates,
      featuredEventId: parsed.featuredEventId ?? DEFAULT_STATE.featuredEventId,
      lastForumNotifiedAt: parsed.lastForumNotifiedAt ?? DEFAULT_STATE.lastForumNotifiedAt,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

// Anchored to America/New_York so "today" always matches the server's content
// scheduler/push notification clock (server/src/scheduler.ts's todayInTimezone()) —
// using the browser's local date or UTC here instead caused the content-schedule
// lookup to miss the server's row for several hours every evening, which made
// the recipe/well-activity silently fall back to yesterday's value instead of
// today's freshly generated one.
function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Builds a Date for the fallback rotation (getFallbackRecipe/getFallbackWellActivity)
// that matches todayISO()'s date, anchored at noon so local-timezone offsets can't
// push it across a day boundary.
function todayAsDate(): Date {
  return new Date(`${todayISO()}T12:00:00`);
}

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

function adminHeaders(): HeadersInit {
  const token = window.localStorage.getItem("adminToken");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    // Most app-level admins (recognized via ADMIN_EMAILS) never go through
    // the separate /admin/login JWT flow, so without this fallback every
    // requireAdmin-gated request (pin/unpin, etc.) from inside the regular
    // app 401s silently — matches the same fallback used by the dedicated
    // admin pages (AdminMembers.tsx, AdminContent.tsx, etc.).
    const fallbackKey = import.meta.env.VITE_ADMIN_API_KEY as string | undefined;
    if (fallbackKey) headers["x-admin-key"] = fallbackKey;
  }
  return headers;
}

function syncForumThread(thread: ForumThread) {
  if (!API_URL) return;
  fetch(`${API_URL}/api/forum/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: thread.id,
      categoryId: thread.categoryId,
      title: thread.title,
      authorId: thread.authorId,
      authorName: thread.authorName,
      authorAvatar: thread.authorAvatar,
      text: thread.messages[0].text,
      messageId: thread.messages[0].id,
      image: thread.messages[0].image,
    }),
  }).catch((err) => console.error("Failed to sync new thread:", err));
}

function syncForumMessage(threadId: string, message: ThreadMessage) {
  if (!API_URL) return;
  fetch(`${API_URL}/api/forum/threads/${threadId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: message.id,
      authorId: message.authorId,
      authorName: message.authorName,
      authorAvatar: message.authorAvatar,
      text: message.text,
      replyToId: message.replyToId,
      image: message.image,
    }),
  }).catch((err) => console.error("Failed to sync new message:", err));
}

function syncForumLike(threadId: string, messageId: string, userId: string) {
  if (!API_URL) return;
  fetch(`${API_URL}/api/forum/threads/${threadId}/messages/${messageId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  }).catch((err) => console.error("Failed to sync like:", err));
}

function syncAddCategory(category: ForumCategory) {
  if (!API_URL) return;
  fetch(`${API_URL}/api/forum/categories`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(category),
  }).catch((err) => console.error("Failed to sync category:", err));
}

function syncDeleteCategory(categoryId: string) {
  if (!API_URL) return;
  fetch(`${API_URL}/api/forum/categories/${categoryId}`, { method: "DELETE", headers: adminHeaders() }).catch((err) =>
    console.error("Failed to sync category deletion:", err)
  );
}

function syncDeleteThread(threadId: string) {
  if (!API_URL) return;
  fetch(`${API_URL}/api/forum/threads/${threadId}`, { method: "DELETE", headers: adminHeaders() }).catch((err) =>
    console.error("Failed to sync thread deletion:", err)
  );
}

function syncDeleteMessage(threadId: string, messageId: string) {
  if (!API_URL) return;
  fetch(`${API_URL}/api/forum/threads/${threadId}/messages/${messageId}`, {
    method: "DELETE",
    headers: adminHeaders(),
  }).catch((err) => console.error("Failed to sync message deletion:", err));
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

interface AppContextValue extends PersistedState {
  updateProfile: (updates: Partial<Pick<User, "name" | "avatar" | "bio" | "birthday" | "showBirthdayOnCalendar">>) => void;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => void;
  addThread: (categoryId: string, title: string, text: string, image?: string) => ForumThread;
  addMessage: (threadId: string, text: string, image?: string) => void;
  toggleMessageLike: (threadId: string, messageId: string) => void;
  addCategory: (category: Omit<ForumCategory, "id">) => void;
  updateCategory: (categoryId: string, updates: Partial<Omit<ForumCategory, "id">>) => void;
  deleteCategory: (categoryId: string) => void;
  deleteThread: (threadId: string) => void;
  deleteMessage: (threadId: string, messageId: string) => void;
  editThread: (threadId: string, newTitle: string) => void;
  editMessage: (threadId: string, messageId: string, newText: string) => void;
  pinThread: (threadId: string, categoryId: string) => void;
  unpinThread: (threadId: string) => void;
  toggleInspirationLike: (inspirationId: string) => void;
  toggleInspirationSave: (inspirationId: string) => void;
  addInspiration: (inspiration: Omit<Inspiration, "id" | "likes" | "savedBy">) => void;
  deleteInspiration: (inspirationId: string) => void;
  saveWorkoutPlan: (plan: WorkoutPlan) => void;
  removeSavedWorkout: (savedId: string) => void;
  toggleRecipeSave: (recipe: Recipe) => void;
  savedRecipes: SavedRecipe[];
  recipeFolders: RecipeFolder[];
  createRecipeFolder: (name: string) => void;
  deleteRecipeFolder: (folderId: number) => void;
  moveRecipeToFolder: (savedRecipeId: number, folderId: number | null) => void;
  fetchRecipeHistory: (before?: string, limit?: number) => Promise<Recipe[]>;
  toggleRsvp: (eventId: string) => void;
  addEvent: (
    event: Omit<CommunityEvent, "id" | "rsvps" | "recurrenceGroupId">,
    recurrence?: { frequency: "weekly" }
  ) => void;
  updateEvent: (eventId: string, updates: Partial<Omit<CommunityEvent, "id" | "rsvps">>) => void;
  deleteEvent: (eventId: string, options?: { series?: boolean }) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  sendNotification: (type: AppNotificationType, title: string, body: string, link?: string) => void;
  logWorkoutCompletion: () => void;
  logCustomWorkout: (note: string) => void;
  logBreathworkCompletion: () => void;
  logWellActivityCompletion: () => void;
  logClassCompletion: () => void;
  importContentSchedule: (entries: ContentBatchEntry[]) => void;
  removeContentEntry: (date: string) => void;
  setFeaturedEvent: (eventId: string | null) => void;
  soldOutEventIds: string[];
  toggleLiveEventSoldOut: (eventId: string) => void;
  setFeaturedBadge: (badgeId: string | null) => void;
  currentWeeklyTheme: Inspiration | undefined;
  todaysWellActivity: WellActivity;
  todaysRecipe: Recipe;
  memberBadges: Record<string, MemberDirectoryEntry>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => loadState());

  // Lets any avatar in the app — forum posts/messages, DMs, not just the
  // WELL Tribe pages — show that member's current badge, avatar, and name,
  // keyed by the same id used everywhere else (deriveMemberId), instead of
  // whatever was baked into a thread/message at the moment it was posted
  // (which goes stale the instant the member changes their photo or name).
  // Not persisted: it's a live directory, refetched fresh each session.
  const [memberBadges, setMemberBadges] = useState<Record<string, MemberDirectoryEntry>>({});

  // Saved recipes and folders live server-side (saved_recipes / recipe_folders
  // tables), not in localStorage — recipe content (images, steps) is too big
  // to keep dumping into the ~50KB local quota on top of everything else.
  // Refetched fresh each session, same as memberBadges above.
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [recipeFolders, setRecipeFolders] = useState<RecipeFolder[]>([]);

  // Sold-out status for live (WordPress-sourced) events, which have no row in
  // our own `events` table to hold a column — see setting key
  // "soldOutEventIds" on the server. Local events still use their own
  // `soldOut` column; this list is consulted in addition to that.
  const [soldOutEventIds, setSoldOutEventIds] = useState<string[]>([]);

  // Flips true once the restore-from-server fetch (below) has settled, so the
  // profile-sync push effect knows it's safe to push without risking
  // overwriting good server data with not-yet-restored local state.
  const hasAttemptedRestoreRef = useRef(false);
  const [restoreGate, setRestoreGate] = useState(0);

  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/api/members`)
      .then((res) => (res.ok ? res.json() : { members: [] }))
      .then((data) => {
        const map: Record<string, MemberDirectoryEntry> = {};
        for (const m of data.members || []) {
          map[m.id] = {
            name: m.name,
            avatar: m.avatar,
            levelBadge: m.levelBadge,
            bonusBadges: m.bonusBadges,
            grantedBadges: m.grantedBadges,
            featuredBadge: m.featuredBadge,
          };
        }
        setMemberBadges(map);
      })
      .catch((err) => console.error("Failed to fetch member badges:", err));
  }, []);

  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/api/settings/sold-out-events`)
      .then((res) => (res.ok ? res.json() : { ids: [] }))
      .then((data) => setSoldOutEventIds(data.ids || []))
      .catch((err) => console.error("Failed to fetch sold-out events:", err));
  }, []);

  useEffect(() => {
    if (!API_URL || !state.user.email) return;
    const email = encodeURIComponent(state.user.email);
    fetch(`${API_URL}/api/recipes/saved?email=${email}`)
      .then((res) => (res.ok ? res.json() : { savedRecipes: [] }))
      .then((data) => setSavedRecipes(data.savedRecipes || []))
      .catch((err) => console.error("Failed to fetch saved recipes:", err));
    fetch(`${API_URL}/api/recipes/folders?email=${email}`)
      .then((res) => (res.ok ? res.json() : { folders: [] }))
      .then((data) => setRecipeFolders(data.folders || []))
      .catch((err) => console.error("Failed to fetch recipe folders:", err));

    // One-time backfill: members who toggled categories off before this
    // server-side enforcement shipped only had that preference saved in
    // localStorage, which broadcastNotification/sendNotificationToUser have
    // no way to see. Push whatever is currently set locally so it takes
    // effect without requiring the member to re-toggle anything.
    fetch(`${API_URL}/api/members/notification-settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: state.user.email, notificationSettings: state.notificationSettings }),
    }).catch((err) => console.error("Failed to backfill notification settings:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user.email]);

  useEffect(() => {
    try {
      // Persist ONLY user data — everything else (threads, inspirations, events, etc.)
      // is fetched fresh from the API on every page load anyway. This keeps localStorage
      // under 50KB and prevents quota errors that cause data loss on PWAs.
      const stateToPersist = {
        user: {
          ...state.user,
          avatar: state.user.avatar?.startsWith("data:") ? "" : state.user.avatar,
          // Save which inspirations the user has saved/liked, so they persist across reloads
          savedInspirationIds: state.inspirations
            .filter((i) => i.savedBy.includes(state.user.id))
            .map((i) => i.id),
          likedInspirationIds: state.inspirations
            .filter((i) => i.likes.includes(state.user.id))
            .map((i) => i.id),
        },
        notificationSettings: state.notificationSettings,
        processedDates: state.processedDates,
        featuredEventId: state.featuredEventId,
        lastForumNotifiedAt: state.lastForumNotifiedAt,
        // The notifications bell is entirely client-generated (weekly theme,
        // daily inspiration, profile nudges) with no server copy, so unlike
        // threads/inspirations/events it has to be persisted here or every
        // reload wipes it back to the hardcoded seed data — losing new
        // notifications and resetting read ones back to unread. Capped to
        // the most recent 100 to keep it from growing unbounded over time.
        notifications: state.notifications.slice(0, 100),
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch (err) {
      if ((err as Error).name === "QuotaExceededError") {
        console.warn("localStorage quota exceeded, attempting automatic recovery...");
        if (recoverFromQuotaExceeded()) {
          return;
        }
      }
      console.error("Failed to persist app state to localStorage:", err);
    }
  }, [state]);

  const updateProfile: AppContextValue["updateProfile"] = (updates) => {
    setState((prev) => ({ ...prev, user: { ...prev.user, ...updates } }));
  };

  const updateNotificationSettings: AppContextValue["updateNotificationSettings"] = (updates) => {
    setState((prev) => {
      const notificationSettings = { ...prev.notificationSettings, ...updates };
      if (API_URL && prev.user.email) {
        fetch(`${API_URL}/api/members/notification-settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: prev.user.email, notificationSettings }),
        }).catch((err) => console.error("Failed to sync notification settings:", err));
      }
      return { ...prev, notificationSettings };
    });
  };

  const addThread: AppContextValue["addThread"] = (categoryId, title, text, image) => {
    const now = new Date().toISOString();
    const thread: ForumThread = {
      id: uid("t"),
      categoryId,
      title,
      authorId: state.user.id,
      authorName: state.user.name,
      authorAvatar: state.user.avatar,
      createdAt: now,
      messages: [
        {
          id: uid("m"),
          authorId: state.user.id,
          authorName: state.user.name,
          authorAvatar: state.user.avatar,
          text,
          createdAt: now,
          likes: [],
          image,
        },
      ],
    };
    setState((prev) => ({ ...prev, threads: [thread, ...prev.threads] }));
    syncForumThread(thread);
    return thread;
  };

  const addMessage: AppContextValue["addMessage"] = (threadId, text, image) => {
    const now = new Date().toISOString();
    const message: ThreadMessage = {
      id: uid("m"),
      authorId: state.user.id,
      authorName: state.user.name,
      authorAvatar: state.user.avatar,
      text,
      createdAt: now,
      likes: [],
      image,
    };
    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((thread) =>
        thread.id === threadId ? { ...thread, messages: [...thread.messages, message] } : thread
      ),
    }));
    syncForumMessage(threadId, message);
  };

  const toggleMessageLike: AppContextValue["toggleMessageLike"] = (threadId, messageId) => {
    syncForumLike(threadId, messageId, state.user.id);
    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((thread) => {
        if (thread.id !== threadId) return thread;
        return {
          ...thread,
          messages: thread.messages.map((message) => {
            if (message.id !== messageId) return message;
            const hasLiked = message.likes.includes(prev.user.id);
            return {
              ...message,
              likes: hasLiked
                ? message.likes.filter((id) => id !== prev.user.id)
                : [...message.likes, prev.user.id],
            };
          }),
        };
      }),
    }));
  };

  const addCategory: AppContextValue["addCategory"] = (category) => {
    const newCategory = { ...category, id: uid("cat") };
    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }));
    syncAddCategory(newCategory);
  };

  const updateCategory: AppContextValue["updateCategory"] = (categoryId, updates) => {
    setState((prev) => {
      const updated = prev.categories.find((c) => c.id === categoryId);
      if (updated) syncAddCategory({ ...updated, ...updates });
      return {
        ...prev,
        categories: prev.categories.map((category) =>
          category.id === categoryId ? { ...category, ...updates } : category
        ),
      };
    });
  };

  const deleteCategory: AppContextValue["deleteCategory"] = (categoryId) => {
    syncDeleteCategory(categoryId);
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((category) => category.id !== categoryId),
      threads: prev.threads.filter((thread) => thread.categoryId !== categoryId),
    }));
  };

  const deleteThread: AppContextValue["deleteThread"] = (threadId) => {
    syncDeleteThread(threadId);
    setState((prev) => ({
      ...prev,
      threads: prev.threads.filter((thread) => thread.id !== threadId),
    }));
  };

  const deleteMessage: AppContextValue["deleteMessage"] = (threadId, messageId) => {
    syncDeleteMessage(threadId, messageId);
    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((thread) =>
        thread.id === threadId
          ? { ...thread, messages: thread.messages.filter((message) => message.id !== messageId) }
          : thread
      ),
    }));
  };

  const editThread: AppContextValue["editThread"] = (threadId, newTitle) => {
    if (!API_URL) return;
    fetch(`${API_URL}/api/forum/threads/${threadId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, userId: state.user.id }),
    }).catch((err) => console.error("Failed to sync thread edit:", err));

    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((thread) =>
        thread.id === threadId ? { ...thread, title: newTitle, editedAt: new Date().toISOString() } : thread
      ),
    }));
  };

  const editMessage: AppContextValue["editMessage"] = (threadId, messageId, newText) => {
    if (!API_URL) return;
    fetch(`${API_URL}/api/forum/threads/${threadId}/messages/${messageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText, userId: state.user.id }),
    }).catch((err) => console.error("Failed to sync message edit:", err));

    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              messages: thread.messages.map((message) =>
                message.id === messageId
                  ? { ...message, text: newText, editedAt: new Date().toISOString() }
                  : message
              ),
            }
          : thread
      ),
    }));
  };

  const pinThread: AppContextValue["pinThread"] = (threadId, categoryId) => {
    if (!API_URL) return;
    const pinnedAt = new Date().toISOString();

    // Optimistic update first so the UI responds immediately; rolled back
    // below if the server rejects it (401, max-3-per-category limit, etc.)
    // — without the rollback, a rejected pin silently disappears on the
    // next 20s forum poll with no indication anything went wrong.
    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((thread) =>
        thread.id === threadId ? { ...thread, pinnedAt } : thread
      ),
    }));

    fetch(`${API_URL}/api/forum/threads/${threadId}/pin?categoryId=${encodeURIComponent(categoryId)}`, {
      method: "POST",
      headers: adminHeaders(),
    })
      .then(async (res) => {
        if (res.ok) return;
        const data = await res.json().catch(() => ({}));
        console.error("Failed to pin thread:", res.status, data.error);
        setState((prev) => ({
          ...prev,
          threads: prev.threads.map((thread) =>
            thread.id === threadId ? { ...thread, pinnedAt: undefined } : thread
          ),
        }));
      })
      .catch((err) => console.error("Failed to pin thread:", err));
  };

  const unpinThread: AppContextValue["unpinThread"] = (threadId) => {
    if (!API_URL) return;
    const previousPinnedAt = state.threads.find((t) => t.id === threadId)?.pinnedAt;

    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((thread) =>
        thread.id === threadId ? { ...thread, pinnedAt: undefined } : thread
      ),
    }));

    fetch(`${API_URL}/api/forum/threads/${threadId}/unpin`, {
      method: "POST",
      headers: adminHeaders(),
    })
      .then(async (res) => {
        if (res.ok) return;
        const data = await res.json().catch(() => ({}));
        console.error("Failed to unpin thread:", res.status, data.error);
        setState((prev) => ({
          ...prev,
          threads: prev.threads.map((thread) =>
            thread.id === threadId ? { ...thread, pinnedAt: previousPinnedAt } : thread
          ),
        }));
      })
      .catch((err) => console.error("Failed to unpin thread:", err));
  };

  const toggleInspirationLike: AppContextValue["toggleInspirationLike"] = (inspirationId) => {
    setState((prev) => ({
      ...prev,
      inspirations: prev.inspirations.map((inspiration) => {
        if (inspiration.id !== inspirationId) return inspiration;
        const hasLiked = inspiration.likes.includes(prev.user.id);
        return {
          ...inspiration,
          likes: hasLiked
            ? inspiration.likes.filter((id) => id !== prev.user.id)
            : [...inspiration.likes, prev.user.id],
        };
      }),
    }));
  };

  const toggleInspirationSave: AppContextValue["toggleInspirationSave"] = (inspirationId) => {
    setState((prev) => ({
      ...prev,
      inspirations: prev.inspirations.map((inspiration) => {
        if (inspiration.id !== inspirationId) return inspiration;
        const hasSaved = inspiration.savedBy.includes(prev.user.id);
        return {
          ...inspiration,
          savedBy: hasSaved
            ? inspiration.savedBy.filter((id) => id !== prev.user.id)
            : [...inspiration.savedBy, prev.user.id],
        };
      }),
    }));
  };

  const saveWorkoutPlan: AppContextValue["saveWorkoutPlan"] = (plan) => {
    setState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        savedWorkouts: [
          {
            id: uid("w"),
            savedAt: new Date().toISOString(),
            cardioId: plan.cardio.id,
            resistance: plan.resistance,
            stretches: plan.stretches,
            breathwork: plan.breathwork,
          },
          ...(prev.user.savedWorkouts ?? []),
        ],
      },
    }));
  };

  const removeSavedWorkout: AppContextValue["removeSavedWorkout"] = (savedId) => {
    setState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        savedWorkouts: (prev.user.savedWorkouts ?? []).filter((w) => w.id !== savedId),
      },
    }));
  };

  const toggleRecipeSave: AppContextValue["toggleRecipeSave"] = (recipe) => {
    const existing = savedRecipes.find((r) => r.name === recipe.name && r.date === recipe.date);
    if (existing) {
      setSavedRecipes((prev) => prev.filter((r) => r.id !== existing.id));
      if (API_URL) {
        fetch(`${API_URL}/api/recipes/saved/${existing.id}`, { method: "DELETE" }).catch((err) =>
          console.error("Failed to unsave recipe:", err)
        );
      }
      return;
    }

    if (!API_URL || !state.user.email) return;
    fetch(`${API_URL}/api/recipes/saved`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: state.user.email, recipe, date: recipe.date }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to save recipe"))))
      .then((data) => setSavedRecipes((prev) => [data.savedRecipe, ...prev]))
      .catch((err) => console.error("Failed to save recipe:", err));
  };

  const createRecipeFolder: AppContextValue["createRecipeFolder"] = (name) => {
    if (!API_URL || !state.user.email || !name.trim()) return;
    fetch(`${API_URL}/api/recipes/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: state.user.email, name: name.trim() }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to create folder"))))
      .then((data) => setRecipeFolders((prev) => [...prev, data.folder]))
      .catch((err) => console.error("Failed to create recipe folder:", err));
  };

  const deleteRecipeFolder: AppContextValue["deleteRecipeFolder"] = (folderId) => {
    setRecipeFolders((prev) => prev.filter((f) => f.id !== folderId));
    setSavedRecipes((prev) => prev.map((r) => (r.folderId === folderId ? { ...r, folderId: undefined } : r)));
    if (!API_URL) return;
    fetch(`${API_URL}/api/recipes/folders/${folderId}`, { method: "DELETE" }).catch((err) =>
      console.error("Failed to delete recipe folder:", err)
    );
  };

  const moveRecipeToFolder: AppContextValue["moveRecipeToFolder"] = (savedRecipeId, folderId) => {
    setSavedRecipes((prev) => prev.map((r) => (r.id === savedRecipeId ? { ...r, folderId: folderId ?? undefined } : r)));
    if (!API_URL) return;
    fetch(`${API_URL}/api/recipes/saved/${savedRecipeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId }),
    }).catch((err) => console.error("Failed to move saved recipe:", err));
  };

  const fetchRecipeHistory: AppContextValue["fetchRecipeHistory"] = async (before, limit) => {
    if (!API_URL) return [];
    const params = new URLSearchParams();
    if (before) params.set("before", before);
    if (limit) params.set("limit", String(limit));
    const res = await fetch(`${API_URL}/api/recipes/history?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    const recipes: Recipe[] = data.recipes || [];
    // The history endpoint returns raw content_schedule rows, which (like
    // today's recipe before this same fallback is applied below) often have
    // no stored image — resolve one the same way todaysRecipe does, instead
    // of leaving the <img> src empty.
    return recipes.map((recipe) => ({
      ...recipe,
      image:
        recipe.image ||
        (recipe.imageCategory
          ? getRecipePhotoByCategory(recipe.imageCategory, recipe.name)
          : getRecipePhoto(recipe.name, recipe.ingredients)),
    }));
  };

  const addInspiration: AppContextValue["addInspiration"] = (inspiration) => {
    setState((prev) => ({
      ...prev,
      inspirations: [{ ...inspiration, id: uid("i"), likes: [], savedBy: [] }, ...prev.inspirations],
    }));
  };

  const deleteInspiration: AppContextValue["deleteInspiration"] = (inspirationId) => {
    setState((prev) => ({
      ...prev,
      inspirations: prev.inspirations.filter((inspiration) => inspiration.id !== inspirationId),
    }));
  };

  const toggleRsvp: AppContextValue["toggleRsvp"] = (eventId) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((event) => {
        if (event.id !== eventId) return event;
        const hasRsvped = event.rsvps.includes(prev.user.id);
        return {
          ...event,
          rsvps: hasRsvped
            ? event.rsvps.filter((id) => id !== prev.user.id)
            : [...event.rsvps, prev.user.id],
        };
      }),
    }));

    if (API_URL) {
      fetch(`${API_URL}/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: state.user.id }),
      }).catch((err) => console.error("Failed to sync RSVP:", err));
    }
  };

  const refreshEvents = () => {
    if (!API_URL) return;
    fetch(`${API_URL}/api/events`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setState((prev) => ({ ...prev, events: data.events ?? prev.events }));
      })
      .catch(() => {
        // offline or backend unreachable — fall back to whatever local content exists
      });
  };

  const addEvent: AppContextValue["addEvent"] = (event, recurrence) => {
    if (!API_URL) {
      setState((prev) => ({
        ...prev,
        events: [...prev.events, { ...event, id: uid("e"), rsvps: [] }],
      }));
      return;
    }

    fetch(`${API_URL}/api/events`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ ...event, recurrence }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then(() => refreshEvents())
      .catch((err) => console.error("Failed to create event:", err));
  };

  const updateEvent: AppContextValue["updateEvent"] = (eventId, updates) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((event) => (event.id === eventId ? { ...event, ...updates } : event)),
    }));

    if (API_URL) {
      const updated = state.events.find((event) => event.id === eventId);
      if (updated) {
        fetch(`${API_URL}/api/events/${eventId}`, {
          method: "PUT",
          headers: adminHeaders(),
          body: JSON.stringify({ ...updated, ...updates }),
        }).catch((err) => console.error("Failed to sync event update:", err));
      }
    }
  };

  const deleteEvent: AppContextValue["deleteEvent"] = (eventId, options) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.filter((event) =>
        options?.series
          ? !(event.id === eventId || event.recurrenceGroupId === prev.events.find((e) => e.id === eventId)?.recurrenceGroupId)
          : event.id !== eventId
      ),
    }));

    if (API_URL) {
      const query = options?.series ? "?series=true" : "";
      fetch(`${API_URL}/api/events/${eventId}${query}`, {
        method: "DELETE",
        headers: adminHeaders(),
      }).catch((err) => console.error("Failed to sync event deletion:", err));
    }
  };

  const markNotificationRead: AppContextValue["markNotificationRead"] = (notificationId) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      ),
    }));
  };

  const markAllNotificationsRead: AppContextValue["markAllNotificationsRead"] = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((notification) => ({ ...notification, read: true })),
    }));
  };

  const sendNotification: AppContextValue["sendNotification"] = (type, title, body, link) => {
    setState((prev) => ({
      ...prev,
      notifications: [
        {
          id: uid("n"),
          type,
          title,
          body,
          createdAt: new Date().toISOString(),
          read: false,
          link,
        },
        ...prev.notifications,
      ],
    }));
  };

  const logWorkoutCompletion: AppContextValue["logWorkoutCompletion"] = () => {
    setState((prev) => {
      const today = todayISO();
      const log = prev.user.workoutLog ?? [];
      if (log.includes(today)) return prev;
      return { ...prev, user: { ...prev.user, workoutLog: [...log, today] } };
    });
  };

  // Counts the same as the assigned routine toward the workout streak — the
  // streak only cares whether today's date is in workoutLog, not which
  // workout was done.
  const logCustomWorkout: AppContextValue["logCustomWorkout"] = (note) => {
    setState((prev) => {
      const today = todayISO();
      const log = prev.user.workoutLog ?? [];
      const notes = prev.user.customWorkoutNotes ?? {};
      return {
        ...prev,
        user: {
          ...prev.user,
          workoutLog: log.includes(today) ? log : [...log, today],
          customWorkoutNotes: { ...notes, [today]: note },
        },
      };
    });
  };

  const logBreathworkCompletion: AppContextValue["logBreathworkCompletion"] = () => {
    setState((prev) => {
      const today = todayISO();
      const log = prev.user.breathworkLog ?? [];
      if (log.includes(today)) return prev;
      return { ...prev, user: { ...prev.user, breathworkLog: [...log, today] } };
    });
  };

  const logWellActivityCompletion: AppContextValue["logWellActivityCompletion"] = () => {
    setState((prev) => {
      const today = todayISO();
      const log = prev.user.wellActivityLog ?? [];
      if (log.includes(today)) return prev;
      return { ...prev, user: { ...prev.user, wellActivityLog: [...log, today] } };
    });
  };

  // Unlike workout/breathwork/well-activity (one "did you do this today?" entry
  // per day, for streaks), classLog counts each click-through distinctly —
  // multiple classes opened the same day should each count toward "Class
  // Enthusiast"/"Class Master", so entries are full timestamps, not deduped dates.
  const logClassCompletion: AppContextValue["logClassCompletion"] = () => {
    setState((prev) => ({
      ...prev,
      user: { ...prev.user, classLog: [...(prev.user.classLog ?? []), new Date().toISOString()] },
    }));
  };

  const importContentSchedule: AppContextValue["importContentSchedule"] = (entries) => {
    setState((prev) => {
      const byDate = new Map(prev.contentSchedule.map((entry) => [entry.date, entry]));
      for (const entry of entries) {
        byDate.set(entry.date, entry);
      }
      const merged = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
      return { ...prev, contentSchedule: merged };
    });
  };

  const removeContentEntry: AppContextValue["removeContentEntry"] = (date) => {
    setState((prev) => ({
      ...prev,
      contentSchedule: prev.contentSchedule.filter((entry) => entry.date !== date),
    }));
  };

  const setFeaturedEvent: AppContextValue["setFeaturedEvent"] = (eventId) => {
    setState((prev) => ({
      ...prev,
      featuredEventId: eventId,
    }));
    if (API_URL) {
      fetch(`${API_URL}/api/settings/featured-event`, {
        method: "PUT",
        headers: adminHeaders(),
        body: JSON.stringify({ featuredEventId: eventId }),
      }).catch((err) => console.error("Failed to sync featured event:", err));
    }
  };

  const toggleLiveEventSoldOut: AppContextValue["toggleLiveEventSoldOut"] = (eventId) => {
    const next = soldOutEventIds.includes(eventId)
      ? soldOutEventIds.filter((id) => id !== eventId)
      : [...soldOutEventIds, eventId];
    setSoldOutEventIds(next);
    if (API_URL) {
      fetch(`${API_URL}/api/settings/sold-out-events`, {
        method: "PUT",
        headers: adminHeaders(),
        body: JSON.stringify({ ids: next }),
      }).catch((err) => console.error("Failed to sync sold-out events:", err));
    }
  };

  const setFeaturedBadge: AppContextValue["setFeaturedBadge"] = (badgeId) => {
    setState((prev) => ({
      ...prev,
      user: { ...prev.user, featuredBadge: badgeId ?? undefined },
    }));
    if (API_URL && state.user.email) {
      fetch(`${API_URL}/api/members/featured-badge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: state.user.email, badgeId }),
      }).catch((err) => console.error("Failed to sync featured badge:", err));
    }
  };

  // Process any scheduled content for "today" — adds the weekly theme / daily
  // inspiration to the feed and (if permitted) fires a local push notification.
  useEffect(() => {
    const today = todayISO();
    if (state.processedDates.includes(today)) return;
    const entry = state.contentSchedule.find((item) => item.date === today);
    if (!entry) return;

    setState((prev) => {
      let next = { ...prev };
      const now = new Date().toISOString();
      const isMonday = todayAsDate().getDay() === 1;

      if (entry.weeklyTheme && isMonday) {
        next = {
          ...next,
          inspirations: [
            {
              id: uid("i"),
              title: entry.weeklyTheme.title,
              body: entry.weeklyTheme.body,
              author: "Loretta Bates",
              cadence: "weekly",
              sentAt: now,
              likes: [],
              savedBy: [],
            },
            ...next.inspirations,
          ],
          notifications: [
            {
              id: uid("n"),
              type: "general",
              title: `This week's focus: ${entry.weeklyTheme.title}`,
              body: entry.weeklyTheme.body,
              createdAt: now,
              read: false,
              link: "/inspirations",
            },
            ...next.notifications,
          ],
        };
        if (
          prev.notificationSettings.pushEnabled &&
          prev.notificationSettings.weeklyTheme &&
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          new Notification(`This week's focus: ${entry.weeklyTheme.title}`, { body: entry.weeklyTheme.body });
        }
      }

      if (entry.motivationBoost) {
        next = {
          ...next,
          inspirations: [
            {
              id: uid("i"),
              title: entry.motivationBoost.title,
              body: entry.motivationBoost.body,
              author: "Loretta Bates",
              cadence: "motivational",
              sentAt: now,
              likes: [],
              savedBy: [],
            },
            ...next.inspirations,
          ],
        };
      }

      if (entry.dailyInspiration) {
        next = {
          ...next,
          inspirations: [
            {
              id: uid("i"),
              title: entry.dailyInspiration.title,
              body: entry.dailyInspiration.body,
              author: "Loretta Bates",
              cadence: "daily",
              sentAt: now,
              likes: [],
              savedBy: [],
            },
            ...next.inspirations,
          ],
          notifications: [
            {
              id: uid("n"),
              type: "general",
              title: entry.dailyInspiration.title,
              body: entry.dailyInspiration.body,
              createdAt: now,
              read: false,
              link: "/inspirations",
            },
            ...next.notifications,
          ],
        };
        if (
          prev.notificationSettings.pushEnabled &&
          prev.notificationSettings.dailyInspiration &&
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          new Notification(entry.dailyInspiration.title, { body: entry.dailyInspiration.body });
        }
      }

      return { ...next, processedDates: [...next.processedDates, today] };
    });
  }, [state.contentSchedule, state.processedDates]);

  // Sync today's server-side content (recipe, well activity, AI motivation boost,
  // etc.) into local state so every member's device — not just the admin's —
  // gets it, even if they've never visited the admin Content Schedule page.
  // Polls (rather than fetching once on mount) because the daily send fires
  // server-side at 7am — a member who already had the app open before then
  // would otherwise be stuck looking at yesterday's content until they fully
  // reload, since "today" never gets refetched on its own.
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_PUSH_API_URL as string | undefined;
    if (!apiUrl) return;

    const syncTodayContent = () => {
      fetch(`${apiUrl}/api/content-today`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const entry = data?.today as ContentBatchEntry | undefined;
          if (!entry) return;
          setState((prev) => {
            const byDate = new Map(prev.contentSchedule.map((e) => [e.date, e]));
            byDate.set(entry.date, { ...byDate.get(entry.date), ...entry });

            // Add today's daily inspiration to the inspirations array if it exists
            let updatedInspirations = prev.inspirations;
            if (entry.dailyInspiration) {
              const dailyId = `daily-${entry.date}`;
              // Prefer the existing item's own likes/savedBy (already-authoritative
              // local state) over re-deriving from user.likedInspirationIds/
              // savedInspirationIds, which can still be empty here if this poll
              // fires before the server-restore fetch finishes — re-deriving in
              // that window would wipe out a real save/like, and the next sync-
              // to-server push would then persist that empty state permanently.
              const existingDaily = updatedInspirations.find((i) => i.id === dailyId);
              // Remove any old "daily" inspiration for today so we don't have duplicates
              updatedInspirations = updatedInspirations.filter(
                (i) => !(i.cadence === "daily" && i.sentAt.startsWith(entry.date))
              );
              // Add the fresh daily inspiration with a recent sentAt time so it sorts first
              updatedInspirations = [
                {
                  id: dailyId,
                  title: entry.dailyInspiration.title,
                  body: entry.dailyInspiration.body,
                  cadence: "daily",
                  author: "WELL Collective",
                  sentAt: new Date(entry.date + "T07:00:00").toISOString(),
                  likes:
                    existingDaily?.likes ??
                    (prev.user.likedInspirationIds?.includes(dailyId) ? [prev.user.id] : []),
                  savedBy:
                    existingDaily?.savedBy ??
                    (prev.user.savedInspirationIds?.includes(dailyId) ? [prev.user.id] : []),
                },
                ...updatedInspirations.filter((i) => i.cadence !== "daily"),
              ];
            }

            // Weekly theme and motivation boost entries used to only be added
            // once, by the processedDates-gated scheduler effect below, with a
            // random id — since `inspirations` is never persisted to
            // localStorage, a reload on the same day lost the entry entirely
            // (processedDates already blocked it from being regenerated), so
            // any like/save on it got orphaned: the id was saved server-side
            // but no matching inspiration existed locally to show it on. Same
            // deterministic-id + reconcile-every-poll fix as `dailyInspiration`
            // above makes them just as resilient.
            if (entry.weeklyTheme && new Date(entry.date + "T00:00:00").getDay() === 1) {
              const weeklyId = `weekly-${entry.date}`;
              const existingWeekly = updatedInspirations.find((i) => i.id === weeklyId);
              updatedInspirations = updatedInspirations.filter(
                (i) => !(i.cadence === "weekly" && i.sentAt.startsWith(entry.date))
              );
              updatedInspirations = [
                {
                  id: weeklyId,
                  title: entry.weeklyTheme.title,
                  body: entry.weeklyTheme.body,
                  cadence: "weekly",
                  author: "Loretta Bates",
                  sentAt: new Date(entry.date + "T07:00:00").toISOString(),
                  likes:
                    existingWeekly?.likes ??
                    (prev.user.likedInspirationIds?.includes(weeklyId) ? [prev.user.id] : []),
                  savedBy:
                    existingWeekly?.savedBy ??
                    (prev.user.savedInspirationIds?.includes(weeklyId) ? [prev.user.id] : []),
                },
                ...updatedInspirations.filter((i) => i.cadence !== "weekly"),
              ];
            }

            if (entry.motivationBoost) {
              const motivationId = `motivation-${entry.date}`;
              const existingMotivation = updatedInspirations.find((i) => i.id === motivationId);
              updatedInspirations = updatedInspirations.filter(
                (i) => !(i.cadence === "motivational" && i.sentAt.startsWith(entry.date))
              );
              updatedInspirations = [
                {
                  id: motivationId,
                  title: entry.motivationBoost.title,
                  body: entry.motivationBoost.body,
                  cadence: "motivational",
                  author: "Loretta Bates",
                  sentAt: new Date(entry.date + "T07:00:00").toISOString(),
                  likes:
                    existingMotivation?.likes ??
                    (prev.user.likedInspirationIds?.includes(motivationId) ? [prev.user.id] : []),
                  savedBy:
                    existingMotivation?.savedBy ??
                    (prev.user.savedInspirationIds?.includes(motivationId) ? [prev.user.id] : []),
                },
                ...updatedInspirations.filter((i) => i.cadence !== "motivational"),
              ];
            }

            return {
              ...prev,
              contentSchedule: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
              inspirations: updatedInspirations,
            };
          });
        })
        .catch(() => {
          // offline or backend unreachable — fall back to whatever local content exists
        });
    };

    syncTodayContent();
    const interval = setInterval(syncTodayContent, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sync the Community forum (categories + threads/messages) from the shared
  // backend so posts are visible across everyone's devices, not just the one
  // they were created on. Polls on an interval (rather than fetching once on
  // mount) because members often leave the app open in the background —
  // without polling, a post made by someone else would never appear until
  // the viewer fully reloads the app.
  useEffect(() => {
    if (!API_URL) return;

    const syncForum = () => {
      Promise.all([
        fetch(`${API_URL}/api/forum/categories`).then((res) => (res.ok ? res.json() : null)),
        fetch(`${API_URL}/api/forum/threads`).then((res) => (res.ok ? res.json() : null)),
      ])
        .then(([categoriesData, threadsData]) => {
          setState((prev) => {
            const newThreads: ForumThread[] = threadsData?.threads ?? prev.threads;

            // Bell-notification reconciliation: turn newly-arrived posts/replies
            // into AppNotification entries (the bell was otherwise only ever
            // populated by weekly theme/daily inspiration — community activity
            // never showed up there even though its push notification fired).
            // `lastForumNotifiedAt` is a watermark, not a per-item dedupe set,
            // so a device seeing this for the first time establishes a baseline
            // instead of generating a notification for the entire forum history.
            let next = { ...prev, categories: categoriesData?.categories ?? prev.categories, threads: newThreads };
            const baseline = prev.lastForumNotifiedAt;
            let newest = baseline ?? "";
            const newNotifications: AppNotification[] = [];

            for (const thread of newThreads) {
              if (thread.createdAt > newest) newest = thread.createdAt;
              const isOwn = thread.authorId === prev.user.id;
              const postId = `n-thread-${thread.id}`;
              if (
                baseline &&
                thread.createdAt > baseline &&
                !isOwn &&
                prev.notificationSettings.community &&
                !prev.notifications.some((n) => n.id === postId)
              ) {
                newNotifications.push({
                  id: postId,
                  type: "post",
                  title: `${thread.authorName} posted in ${thread.title}`,
                  body: thread.messages[0]?.text ?? "",
                  createdAt: thread.createdAt,
                  read: false,
                  link: `/community/${thread.categoryId}/${thread.id}`,
                });
              }

              // messages[0] is the thread's own opening post (already handled
              // above as a "post" notification) — only replies after it count.
              for (const message of thread.messages.slice(1)) {
                if (message.createdAt > newest) newest = message.createdAt;
                const replyId = `n-msg-${message.id}`;
                if (
                  baseline &&
                  message.createdAt > baseline &&
                  message.authorId !== prev.user.id &&
                  prev.notificationSettings.replies &&
                  !prev.notifications.some((n) => n.id === replyId)
                ) {
                  newNotifications.push({
                    id: replyId,
                    type: "reply",
                    title: `${message.authorName} replied in ${thread.title}`,
                    body: message.text || "📷 Shared a photo",
                    createdAt: message.createdAt,
                    read: false,
                    link: `/community/${thread.categoryId}/${thread.id}`,
                  });
                }
              }
            }

            if (newNotifications.length > 0) {
              next = {
                ...next,
                notifications: [...newNotifications, ...prev.notifications],
              };
            }
            if (newest && newest !== baseline) {
              next = { ...next, lastForumNotifiedAt: newest };
            }
            return next;
          });
        })
        .catch(() => {
          // offline or backend unreachable — fall back to whatever local content exists
        });
    };

    syncForum();
    const interval = setInterval(syncForum, 20000);
    return () => clearInterval(interval);
  }, []);

  // Sync community events from the shared backend so an event the admin adds
  // (including every occurrence of a recurring one) shows up for everyone,
  // not just on the device that created it.
  useEffect(() => {
    if (!API_URL) return;

    const syncEvents = () => {
      fetch(`${API_URL}/api/events`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          setState((prev) => ({ ...prev, events: data.events ?? prev.events }));
        })
        .catch(() => {
          // offline or backend unreachable — fall back to whatever local content exists
        });
    };

    syncEvents();
    const interval = setInterval(syncEvents, 20000);
    return () => clearInterval(interval);
  }, []);

  // Sync "Notes from Loretta" — the admin's instant/manual push notifications
  // (not the scheduled daily/weekly content) — from the shared backend so
  // they show up in everyone's Inspirations feed, not just an ephemeral push.
  useEffect(() => {
    if (!API_URL) return;

    const syncNotes = () => {
      fetch(`${API_URL}/api/notes`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const notes = data?.notes as { id: string; title: string; body: string; sentAt: string }[] | undefined;
          if (!notes) return;
          setState((prev) => {
            const existingById = new Map(
              prev.inspirations.filter((i) => i.cadence === "note").map((i) => [i.id, i])
            );
            const savedIds = new Set(prev.user.savedInspirationIds ?? []);
            const likedIds = new Set(prev.user.likedInspirationIds ?? []);
            const syncedIds = new Set(notes.map((n) => n.id));

            // Sync new/updated notes from API
            const noteInspirations: Inspiration[] = notes.map((n) => {
              const existing = existingById.get(n.id);
              const existingLikes = existing?.likes ?? [];
              const shouldLike = likedIds.has(n.id) && !existingLikes.includes(prev.user.id);
              return {
                id: n.id,
                title: n.title,
                body: n.body,
                author: "Loretta",
                cadence: "note",
                sentAt: n.sentAt,
                likes: shouldLike ? [...existingLikes, prev.user.id] : existingLikes,
                savedBy: existing?.savedBy ?? (savedIds.has(n.id) ? [prev.user.id] : []),
              };
            });

            // Preserve old notes that have saves/likes, even if they're not in the API response
            const oldNotesWithSavesOrLikes = Array.from(existingById.values()).filter(
              (note) => !syncedIds.has(note.id) && (note.likes.length > 0 || note.savedBy.length > 0)
            );

            const otherInspirations = prev.inspirations.filter((i) => i.cadence !== "note");
            // Sort by sentAt rather than just prepending notes ahead of
            // everything else — otherwise an old note would permanently sit
            // above a newer daily inspiration/weekly theme, and Home's
            // "Today's Inspiration" card (which reads inspirations[0]) would
            // keep showing yesterday's note instead of resetting to today's
            // actual most recent content.
            return {
              ...prev,
              inspirations: [...noteInspirations, ...oldNotesWithSavesOrLikes, ...otherInspirations].sort((a, b) =>
                b.sentAt.localeCompare(a.sentAt)
              ),
            };
          });
        })
        .catch(() => {
          // offline or backend unreachable — fall back to whatever local content exists
        });
    };

    syncNotes();
    const interval = setInterval(syncNotes, 20000);
    return () => clearInterval(interval);
  }, []);

  // Sync the admin's featured-event pick from the shared backend so every
  // member sees the same highlighted event, not just the admin's own device.
  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/api/settings/featured-event`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setState((prev) => ({ ...prev, featuredEventId: data.featuredEventId }));
      })
      .catch(() => {
        // offline or backend unreachable — fall back to whatever local content exists
      });
  }, []);

  // Push this member's profile (name/avatar/birthday/calendar opt-in/saved+liked
  // inspirations) to the shared member directory so other members can see their
  // birthday on the calendar and so this member's saved/liked inspirations survive
  // localStorage wipes (Safari tracking prevention, logout, device changes, etc.).
  useEffect(() => {
    // Wait for the restore-from-server fetch below to settle at least once.
    // Without this, a page load can push local inspirations state (still
    // empty/incomplete because the restore hasn't landed yet) to the server
    // before the real saved/liked data has been pulled down — permanently
    // overwriting it with an empty list. Pushing only after restore has had
    // its chance ensures we never write less than what the server already has.
    if (!hasAttemptedRestoreRef.current) return;
    if (!API_URL || !state.user.email) return;
    void restoreGate; // re-run this effect once the restore attempt settles
    const savedIds = state.inspirations
      .filter((i) => i.savedBy.includes(state.user.id))
      .map((i) => i.id);
    const likedIds = state.inspirations
      .filter((i) => i.likes.includes(state.user.id))
      .map((i) => i.id);
    fetch(`${API_URL}/api/members/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: state.user.email,
        name: state.user.name,
        avatar: state.user.avatar,
        bio: state.user.bio,
        // Always persist the birthday itself — showBirthdayOnCalendar only
        // controls whether it's *displayed* on the shared calendar. Gating
        // the save on that flag meant a member who never opted in to the
        // calendar had nothing saved server-side to restore from later.
        birthday: state.user.birthday,
        showBirthdayOnCalendar: state.user.showBirthdayOnCalendar,
        // Lets tribe members see each other's streaks on the Home page.
        workoutLog: state.user.workoutLog,
        // Persist saved and liked inspirations server-side so they survive
        // localStorage wipes and are consistent across devices.
        savedInspirationIds: savedIds.length > 0 ? savedIds : undefined,
        likedInspirationIds: likedIds.length > 0 ? likedIds : undefined,
      }),
    }).catch((err) => console.error("Failed to sync member profile:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.user.email,
    state.user.name,
    state.user.avatar,
    state.user.bio,
    state.user.birthday,
    state.user.showBirthdayOnCalendar,
    state.user.workoutLog,
    state.inspirations,
    restoreGate,
  ]);

  // Pull this member's saved profile back from the server to fill in any
  // gaps in local state. This is the recovery path for when localStorage
  // gets wiped out from under the app (Safari's tracking-prevention purge
  // after a period of inactivity, a fresh re-login on a new browser/device,
  // etc.) — without it, a wipe permanently strands the member with a blank
  // avatar/bio/birthday, since the sync effect above only ever pushes local
  // data up and never pulls saved data back down. Same "never destroy, only
  // fill gaps" rule as applyMemberInfo: server data can only fill a field
  // that's still empty locally, never overwrite something already present.
  useEffect(() => {
    if (!API_URL || !state.user.email) {
      hasAttemptedRestoreRef.current = true;
      setRestoreGate((n) => n + 1);
      return;
    }
    fetch(`${API_URL}/api/members/me?email=${encodeURIComponent(state.user.email)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const member = data?.member;
        if (!member) return;
        setState((prev) => ({
          ...prev,
          user: {
            ...prev.user,
            // Same placeholder check as applyMemberInfo: "Member" is the
            // never-customized default, not a real saved name, so it's
            // treated as empty and filled from the server like avatar/bio.
            name: prev.user.name && prev.user.name !== CURRENT_USER.name ? prev.user.name : member.name || prev.user.name,
            avatar: prev.user.avatar || member.avatar || prev.user.avatar,
            bio: prev.user.bio || member.bio || prev.user.bio,
            birthday: prev.user.birthday || member.birthday,
            // showBirthdayOnCalendar is a real boolean, not a string — `??`
            // (not `||`) so an explicit `false` the member chose is never
            // treated as "unset" and overwritten by the server's value.
            showBirthdayOnCalendar: prev.user.showBirthdayOnCalendar ?? member.showBirthdayOnCalendar,
            // Always trust the server here — these are computed/granted
            // server-side, never edited locally except via setFeaturedBadge.
            levelBadge: member.levelBadge,
            bonusBadges: member.bonusBadges,
            grantedBadges: member.grantedBadges,
            featuredBadge: member.featuredBadge,
            // Restore saved/liked inspiration IDs from server (resilient to localStorage wipes)
            savedInspirationIds: prev.user.savedInspirationIds || member.savedInspirationIds,
            likedInspirationIds: prev.user.likedInspirationIds || member.likedInspirationIds,
          },
        }));
      })
      .catch((err) => console.error("Failed to restore member profile:", err))
      .finally(() => {
        hasAttemptedRestoreRef.current = true;
        setRestoreGate((n) => n + 1);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user.email]);

  // One-time nudge for members with no profile photo set. Waits for the
  // restore-from-server attempt above to settle first so it never fires for
  // someone who actually has an avatar saved server-side but whose local
  // state just hasn't caught up yet — that would be a false "you have no
  // photo" prompt. Deduped per-email in localStorage so it only ever shows
  // once, even across logout/login or re-deploys.
  useEffect(() => {
    if (!hasAttemptedRestoreRef.current) return;
    if (!state.user.email || state.user.avatar) return;
    const nudgeKey = `avatarNudgeSent:${state.user.email.toLowerCase()}`;
    if (window.localStorage.getItem(nudgeKey)) return;

    window.localStorage.setItem(nudgeKey, "1");
    sendNotification(
      "general",
      "Add a profile photo",
      "Help the community recognize you — add a profile photo in your settings.",
      "/profile/edit"
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user.email, state.user.avatar, restoreGate]);

  const today = todayISO();
  const todaysEntry = state.contentSchedule.find((entry) => entry.date === today);

  const currentWeeklyTheme = [...state.inspirations]
    .filter((i) => i.cadence === "weekly")
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0];

  const todaysWellActivity: WellActivity = todaysEntry?.wellActivity
    ? { date: today, ...todaysEntry.wellActivity }
    : { date: today, ...getFallbackWellActivity(todayAsDate()) };

  const rawRecipe = todaysEntry?.recipe
    ? todaysEntry.recipe
    : getFallbackRecipe(todayAsDate());
  const recipeCategory = (rawRecipe as Record<string, unknown>).imageCategory as string | undefined;

  const baseRecipe = { date: today, ...rawRecipe };

  const todaysRecipe: Recipe = {
    ...baseRecipe,
    imageCategory: recipeCategory,
    image: baseRecipe.image
      || (recipeCategory
        ? getRecipePhotoByCategory(recipeCategory, baseRecipe.name)
        : getRecipePhoto(baseRecipe.name, baseRecipe.ingredients)),
  };

  const value: AppContextValue = {
    ...state,
    updateProfile,
    updateNotificationSettings,
    addThread,
    addMessage,
    toggleMessageLike,
    addCategory,
    updateCategory,
    deleteCategory,
    deleteThread,
    deleteMessage,
    editThread,
    editMessage,
    pinThread,
    unpinThread,
    toggleInspirationLike,
    toggleInspirationSave,
    saveWorkoutPlan,
    removeSavedWorkout,
    toggleRecipeSave,
    savedRecipes,
    recipeFolders,
    createRecipeFolder,
    deleteRecipeFolder,
    moveRecipeToFolder,
    fetchRecipeHistory,
    addInspiration,
    deleteInspiration,
    toggleRsvp,
    addEvent,
    updateEvent,
    deleteEvent,
    markNotificationRead,
    markAllNotificationsRead,
    sendNotification,
    logWorkoutCompletion,
    logCustomWorkout,
    logBreathworkCompletion,
    logWellActivityCompletion,
    logClassCompletion,
    importContentSchedule,
    removeContentEntry,
    setFeaturedEvent,
    soldOutEventIds,
    toggleLiveEventSoldOut,
    setFeaturedBadge,
    currentWeeklyTheme,
    todaysWellActivity,
    todaysRecipe,
    memberBadges,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
