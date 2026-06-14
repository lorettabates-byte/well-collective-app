import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  CATEGORIES,
  CURRENT_USER,
  EVENTS,
  INSPIRATIONS,
  NOTIFICATIONS,
  THREADS,
} from "../data/mockData";
import type {
  AppNotification,
  AppNotificationType,
  CommunityEvent,
  ForumCategory,
  ForumThread,
  Inspiration,
  NotificationSettings,
  User,
} from "../types";

const STORAGE_KEY = "well-collective-state-v1";

interface PersistedState {
  user: User;
  categories: ForumCategory[];
  threads: ForumThread[];
  inspirations: Inspiration[];
  events: CommunityEvent[];
  notifications: AppNotification[];
  notificationSettings: NotificationSettings;
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
  },
};

function loadState(): PersistedState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      user: parsed.user ?? DEFAULT_STATE.user,
      categories: parsed.categories ?? DEFAULT_STATE.categories,
      threads: parsed.threads ?? DEFAULT_STATE.threads,
      inspirations: parsed.inspirations ?? DEFAULT_STATE.inspirations,
      events: parsed.events ?? DEFAULT_STATE.events,
      notifications: parsed.notifications ?? DEFAULT_STATE.notifications,
      notificationSettings: parsed.notificationSettings ?? DEFAULT_STATE.notificationSettings,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

interface AppContextValue extends PersistedState {
  updateProfile: (updates: Partial<Pick<User, "name" | "avatar" | "bio" | "birthday">>) => void;
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
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => loadState());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore persistence errors
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
    return thread;
  };

  const addMessage: AppContextValue["addMessage"] = (threadId, text) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              messages: [
                ...thread.messages,
                {
                  id: uid("m"),
                  authorId: prev.user.id,
                  authorName: prev.user.name,
                  authorAvatar: prev.user.avatar,
                  text,
                  createdAt: now,
                  likes: [],
                },
              ],
            }
          : thread
      ),
    }));
  };

  const toggleMessageLike: AppContextValue["toggleMessageLike"] = (threadId, messageId) => {
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
    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, { ...category, id: uid("cat") }],
    }));
  };

  const updateCategory: AppContextValue["updateCategory"] = (categoryId, updates) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((category) =>
        category.id === categoryId ? { ...category, ...updates } : category
      ),
    }));
  };

  const deleteCategory: AppContextValue["deleteCategory"] = (categoryId) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((category) => category.id !== categoryId),
      threads: prev.threads.filter((thread) => thread.categoryId !== categoryId),
    }));
  };

  const deleteThread: AppContextValue["deleteThread"] = (threadId) => {
    setState((prev) => ({
      ...prev,
      threads: prev.threads.filter((thread) => thread.id !== threadId),
    }));
  };

  const deleteMessage: AppContextValue["deleteMessage"] = (threadId, messageId) => {
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
