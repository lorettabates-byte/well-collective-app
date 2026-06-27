import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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
  ThreadMessage,
  User,
  WellActivity,
} from "../types";

const STORAGE_KEY = "well-collective-state-v1";

const FOUNDER_EMAIL = "loretta@lorettabates.com";

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

    const isFounder = memberEmail === FOUNDER_EMAIL.toLowerCase();

    return {
      ...user,
      ...(isFounder
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

function loadState(): PersistedState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, user: applyMemberInfo(DEFAULT_STATE.user) };
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      user: applyMemberInfo(parsed.user ?? DEFAULT_STATE.user),
      categories: parsed.categories ?? DEFAULT_STATE.categories,
      threads: parsed.threads ?? DEFAULT_STATE.threads,
      inspirations: parsed.inspirations ?? DEFAULT_STATE.inspirations,
      events: parsed.events ?? DEFAULT_STATE.events,
      notifications: parsed.notifications ?? DEFAULT_STATE.notifications,
      notificationSettings: {
        ...DEFAULT_STATE.notificationSettings,
        ...parsed.notificationSettings,
      },
      contentSchedule: parsed.contentSchedule ?? DEFAULT_STATE.contentSchedule,
      processedDates: parsed.processedDates ?? DEFAULT_STATE.processedDates,
      featuredEventId: parsed.featuredEventId ?? DEFAULT_STATE.featuredEventId,
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
  if (token) headers.Authorization = `Bearer ${token}`;
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
  addThread: (categoryId: string, title: string, text: string) => ForumThread;
  addMessage: (threadId: string, text: string) => void;
  toggleMessageLike: (threadId: string, messageId: string) => void;
  addCategory: (category: Omit<ForumCategory, "id">) => void;
  updateCategory: (categoryId: string, updates: Partial<Omit<ForumCategory, "id">>) => void;
  deleteCategory: (categoryId: string) => void;
  deleteThread: (threadId: string) => void;
  deleteMessage: (threadId: string, messageId: string) => void;
  toggleInspirationLike: (inspirationId: string) => void;
  toggleInspirationSave: (inspirationId: string) => void;
  addInspiration: (inspiration: Omit<Inspiration, "id" | "likes" | "savedBy">) => void;
  deleteInspiration: (inspirationId: string) => void;
  saveWorkoutPlan: (plan: WorkoutPlan) => void;
  removeSavedWorkout: (savedId: string) => void;
  toggleRecipeSave: (recipe: Recipe) => void;
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
  logBreathworkCompletion: () => void;
  logWellActivityCompletion: () => void;
  logClassCompletion: () => void;
  importContentSchedule: (entries: ContentBatchEntry[]) => void;
  removeContentEntry: (date: string) => void;
  setFeaturedEvent: (eventId: string | null) => void;
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
    try {
      // Strip out large avatar/image data that can exceed localStorage quota.
      // These can be re-fetched from the API as needed.
      const stateToPersist = {
        ...state,
        user: {
          ...state.user,
          avatar: state.user.avatar?.startsWith("data:") ? "" : state.user.avatar,
        },
        threads: state.threads.map((t) => ({
          ...t,
          authorAvatar: t.authorAvatar?.startsWith("data:") ? "" : t.authorAvatar,
          messages: t.messages.map((m) => ({
            ...m,
            authorAvatar: m.authorAvatar?.startsWith("data:") ? "" : m.authorAvatar,
          })),
        })),
        inspirations: state.inspirations.map((i) => ({
          ...i,
          imageUrl: "",
        })),
      };

      const serialized = JSON.stringify(stateToPersist);
      if (serialized.length > 4 * 1024 * 1024) {
        console.warn("Persisted state exceeds 4MB, some data may be lost. Try clearing browser cache or archived old content.");
        return;
      }

      window.localStorage.setItem(STORAGE_KEY, serialized);
    } catch (err) {
      console.error("Failed to persist app state to localStorage:", err);
    }
  }, [state]);

  const updateProfile: AppContextValue["updateProfile"] = (updates) => {
    setState((prev) => ({ ...prev, user: { ...prev.user, ...updates } }));
  };

  const updateNotificationSettings: AppContextValue["updateNotificationSettings"] = (updates) => {
    setState((prev) => ({
      ...prev,
      notificationSettings: { ...prev.notificationSettings, ...updates },
    }));
  };

  const addThread: AppContextValue["addThread"] = (categoryId, title, text) => {
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
        },
      ],
    };
    setState((prev) => ({ ...prev, threads: [thread, ...prev.threads] }));
    syncForumThread(thread);
    return thread;
  };

  const addMessage: AppContextValue["addMessage"] = (threadId, text) => {
    const now = new Date().toISOString();
    const message: ThreadMessage = {
      id: uid("m"),
      authorId: state.user.id,
      authorName: state.user.name,
      authorAvatar: state.user.avatar,
      text,
      createdAt: now,
      likes: [],
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
    setState((prev) => {
      const saved = prev.user.savedRecipes ?? [];
      const isSaved = saved.some((r) => r.name === recipe.name);
      return {
        ...prev,
        user: {
          ...prev.user,
          savedRecipes: isSaved ? saved.filter((r) => r.name !== recipe.name) : [recipe, ...saved],
        },
      };
    });
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
            return {
              ...prev,
              contentSchedule: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
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
          setState((prev) => ({
            ...prev,
            categories: categoriesData?.categories ?? prev.categories,
            threads: threadsData?.threads ?? prev.threads,
          }));
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
            const noteInspirations: Inspiration[] = notes.map((n) => {
              const existing = existingById.get(n.id);
              return {
                id: n.id,
                title: n.title,
                body: n.body,
                author: "Loretta",
                cadence: "note",
                sentAt: n.sentAt,
                likes: existing?.likes ?? [],
                savedBy: existing?.savedBy ?? [],
              };
            });
            const otherInspirations = prev.inspirations.filter((i) => i.cadence !== "note");
            // Sort by sentAt rather than just prepending notes ahead of
            // everything else — otherwise an old note would permanently sit
            // above a newer daily inspiration/weekly theme, and Home's
            // "Today's Inspiration" card (which reads inspirations[0]) would
            // keep showing yesterday's note instead of resetting to today's
            // actual most recent content.
            return {
              ...prev,
              inspirations: [...noteInspirations, ...otherInspirations].sort((a, b) =>
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

  // Push this member's profile (name/avatar/birthday/calendar opt-in) to the
  // shared member directory so other members can see their birthday on the
  // calendar and pick them in the new-message user list.
  useEffect(() => {
    if (!API_URL || !state.user.email) return;
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
    if (!API_URL || !state.user.email) return;
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
          },
        }));
      })
      .catch((err) => console.error("Failed to restore member profile:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user.email]);

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
    toggleInspirationLike,
    toggleInspirationSave,
    saveWorkoutPlan,
    removeSavedWorkout,
    toggleRecipeSave,
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
    logBreathworkCompletion,
    logWellActivityCompletion,
    logClassCompletion,
    importContentSchedule,
    removeContentEntry,
    setFeaturedEvent,
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
