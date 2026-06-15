export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  email?: string;
  isAdmin: boolean;
  joinedAt: string;
  birthday?: string; // MM-DD
  workoutLog?: string[]; // ISO dates (yyyy-mm-dd) of completed workouts
  trialEndsAt?: string; // ISO date when free trial expires
}

export interface NotificationSettings {
  community: boolean;
  replies: boolean;
  mentions: boolean;
  general: boolean;
  weeklyTheme: boolean;
  dailyInspiration: boolean;
  pushEnabled: boolean;
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string;
  earned: boolean;
}

export interface WellActivity {
  date: string; // ISO date (yyyy-mm-dd)
  title: string;
  description: string;
  completed?: boolean;
}

export interface Recipe {
  date: string; // ISO date (yyyy-mm-dd)
  name: string;
  description: string;
  ingredients: string[];
  steps: string[];
  image: string;
  saved?: boolean;
}

export interface ContentBatchEntry {
  date: string; // ISO date (yyyy-mm-dd)
  weeklyTheme?: { title: string; body: string };
  dailyInspiration?: { title: string; body: string };
  wellActivity?: { title: string; description: string };
  recipe?: { name: string; description: string; ingredients: string[]; steps: string[]; image: string };
}

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface ThreadMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
  likes: string[]; // userIds who "supported" this message
  replyToId?: string;
}

export interface ForumThread {
  id: string;
  categoryId: string;
  title: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  messages: ThreadMessage[];
}

export type InspirationCadence = "daily" | "weekly" | "motivational";

export interface Inspiration {
  id: string;
  title: string;
  body: string;
  author: string;
  cadence: InspirationCadence;
  sentAt: string;
  image?: string;
  likes: string[];
  savedBy: string[];
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date (yyyy-mm-dd)
  time: string; // e.g. "6:00 PM - 7:00 PM"
  location: string;
  rsvps: string[];
  color: string;
  featured?: boolean;
  image?: string;
  url?: string;
  cost?: string;
  source?: "local" | "live";
}

export type AppNotificationType = "post" | "reply" | "mention" | "general";

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  link?: string;
}
