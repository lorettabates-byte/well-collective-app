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
import { getFallbackWellActivity } from "../data/wellnessLibrary";
import { generateRecipeImage } from "../utils/recipeImageGenerator";
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
const FOUNDER_PROFILE = {
  avatar: "https://i.pravatar.cc/150?img=47",
  bio: "Founder of WELL Collective. On a mission to help women feel calm, strong, and supported. 🌿",
  birthday: "06-14",
};

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
        ? { ...FOUNDER_PROFILE, isAdmin: true, avatar: user.avatar || FOUNDER_PROFILE.avatar }
        : isNewMember
          // Only seed name/avatar/bio/birthday from the WP account on first
          // sync for this email — once synced, the user's own edits in
          // Edit Profile are authoritative and must not be overwritten on
          // every load.
          ? { avatar: "", bio: "", birthday: undefined, isAdmin: false, name: member.name || user.name }
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

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
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
  toggleRsvp: (eventId: string) => void;
  addEvent: (event: Omit<CommunityEvent, "id" | "rsvps">) => void;
  updateEvent: (eventId: string, updates: Partial<Omit<CommunityEvent, "id" | "rsvps">>) => void;
  deleteEvent: (eventId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  sendNotification: (type: AppNotificationType, title: string, body: string, link?: string) => void;
  logWorkoutCompletion: () => void;
  importContentSchedule: (entries: ContentBatchEntry[]) => void;
  removeContentEntry: (date: string) => void;
  setFeaturedEvent: (eventId: string | null) => void;
  currentWeeklyTheme: Inspiration | undefined;
  todaysWellActivity: WellActivity;
  todaysRecipe: Recipe;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => loadState());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // Most commonly a quota-exceeded error from an oversized avatar data URL —
      // log loudly since a silent failure here loses the whole state (profile, etc).
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
  };

  const addEvent: AppContextValue["addEvent"] = (event) => {
    setState((prev) => ({
      ...prev,
      events: [...prev.events, { ...event, id: uid("e"), rsvps: [] }],
    }));
  };

  const updateEvent: AppContextValue["updateEvent"] = (eventId, updates) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((event) => (event.id === eventId ? { ...event, ...updates } : event)),
    }));
  };

  const deleteEvent: AppContextValue["deleteEvent"] = (eventId) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.filter((event) => event.id !== eventId),
    }));
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
      const isMonday = new Date().getDay() === 1;

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
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_PUSH_API_URL as string | undefined;
    if (!apiUrl) return;

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
  }, []);

  // Sync the Community forum (categories + threads/messages) from the shared
  // backend so posts are visible across everyone's devices, not just the one
  // they were created on.
  useEffect(() => {
    if (!API_URL) return;

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
        birthday: state.user.showBirthdayOnCalendar ? state.user.birthday : undefined,
        showBirthdayOnCalendar: state.user.showBirthdayOnCalendar,
      }),
    }).catch((err) => console.error("Failed to sync member profile:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.user.email,
    state.user.name,
    state.user.avatar,
    state.user.birthday,
    state.user.showBirthdayOnCalendar,
  ]);

  const today = todayISO();
  const todaysEntry = state.contentSchedule.find((entry) => entry.date === today);

  const currentWeeklyTheme = [...state.inspirations]
    .filter((i) => i.cadence === "weekly")
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0];

  const todaysWellActivity: WellActivity = todaysEntry?.wellActivity
    ? { date: today, ...todaysEntry.wellActivity }
    : { date: today, ...getFallbackWellActivity(new Date()) };

  const baseRecipe = todaysEntry?.recipe
    ? { date: today, ...todaysEntry.recipe }
    : { date: today, ...getFallbackRecipe(new Date()) };

  const todaysRecipe: Recipe = {
    ...baseRecipe,
    image: baseRecipe.image || generateRecipeImage(baseRecipe.name, baseRecipe.ingredients),
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
    importContentSchedule,
    removeContentEntry,
    setFeaturedEvent,
    currentWeeklyTheme,
    todaysWellActivity,
    todaysRecipe,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
