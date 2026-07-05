import type { SavedWorkoutPlan } from "./data/workoutLibrary";

export type { SavedWorkoutPlan };

export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  email?: string;
  isAdmin: boolean;
  joinedAt: string;
  birthday?: string; // MM-DD
  showBirthdayOnCalendar?: boolean;
  workoutLog?: string[]; // ISO dates (yyyy-mm-dd) of completed workouts
  customWorkoutNotes?: Record<string, string>; // ISO date -> what they did, for days logged via "my own workout" instead of the assigned routine
  breathworkLog?: string[]; // ISO dates of completed breathwork sessions
  wellActivityLog?: string[]; // ISO dates of completed Well Activities
  classLog?: string[]; // ISO dates a class tile (Livestream, Zumba, etc.) was opened
  savedWorkouts?: SavedWorkoutPlan[];
  trialEndsAt?: string; // ISO date when free trial expires
  levelBadge?: string; // computed server-side from activity, e.g. "active-member"
  bonusBadges?: string[]; // auto-earned from tenure/encouragement, e.g. "legacy-builder"
  grantedBadges?: string[]; // admin-granted special badges, e.g. "well-escape"
  featuredBadge?: string; // which earned badge id to show on the avatar
  savedInspirationIds?: string[]; // IDs of inspirations the user has saved
  likedInspirationIds?: string[]; // IDs of inspirations the user has liked
  heightCm?: number;
  weightKg?: number;
  age?: number;
  gender?: "female" | "male" | "other";
  healthSyncEnabled?: boolean; // opt-in to auto-populate steps/sleep/workouts from Apple Health / Health Connect
}

export interface NotificationSettings {
  community: boolean;
  replies: boolean;
  mentions: boolean;
  general: boolean;
  weeklyTheme: boolean;
  dailyInspiration: boolean;
  newEvents: boolean;
  newBlogs: boolean;
  newSongs: boolean;
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

export interface RecipeNutrition {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
}

export interface Recipe {
  date: string; // ISO date (yyyy-mm-dd)
  name: string;
  description: string;
  ingredients: string[];
  steps: string[];
  image: string;
  imageCategory?: string;
  nutrition?: RecipeNutrition;
  // True only when every ingredient resolved against the USDA FoodData
  // Central database — false/absent means `nutrition` is the AI's own
  // calculated estimate, not independently verified.
  nutritionVerified?: boolean;
  saved?: boolean;
}

export interface RecipeFolder {
  id: number;
  name: string;
  createdAt: string;
}

export interface SavedRecipe extends Recipe {
  id: number;
  folderId?: number;
  savedAt: string;
}

export interface MealPlanEntry {
  id: number;
  planDate: string; // ISO date (yyyy-mm-dd)
  mealType: string; // 'breakfast' | 'lunch' | 'dinner' | 'snack'
  recipe: Recipe;
}

export interface ContentBatchEntry {
  date: string; // ISO date (yyyy-mm-dd)
  weeklyTheme?: { title: string; body: string };
  dailyInspiration?: { title: string; body: string };
  wellActivity?: { title: string; description: string };
  recipe?: { name: string; description: string; ingredients: string[]; steps: string[]; image: string };
  motivationBoost?: { title: string; body: string };
  nutritionTip?: string;
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
  editedAt?: string;
  likes: string[]; // userIds who "supported" this message
  replyToId?: string;
  image?: string;
}

export interface ForumThread {
  id: string;
  categoryId: string;
  title: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  editedAt?: string;
  pinnedAt?: string;
  messages: ThreadMessage[];
}

export type InspirationCadence = "daily" | "weekly" | "motivational" | "note";

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
  recurrenceGroupId?: string;
  soldOut?: boolean;
}

export interface Song {
  id: number;
  title: string;
  artist?: string;
  url: string;
  lyrics?: string;
  sortOrder: number;
  categoryIds: number[];
  // Set only while still queued for a future Music Monday (admin queue view).
  releaseAt?: string;
  // True for the song whose release_at fell within the last 7 days — shown
  // as "New This Week" at the top of the playlist.
  featured?: boolean;
}

export interface SongCategory {
  id: number;
  name: string;
  sortOrder: number;
}

export interface CustomPeacefulSound {
  id: number;
  title: string;
  icon: string;
  url: string;
  sortOrder: number;
}

export type AppNotificationType = "post" | "reply" | "mention" | "general" | "event" | "blog";

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  link?: string;
}
