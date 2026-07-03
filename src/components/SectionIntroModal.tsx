import {
  Activity,
  Award,
  Bookmark,
  BookOpen,
  Cake,
  Calendar,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChefHat,
  Clock,
  Dumbbell,
  Edit,
  Globe,
  Heart,
  LayoutList,
  Lightbulb,
  MessageCircle,
  Moon,
  Music,
  Pencil,
  Play,
  Rss,
  Search,
  Share2,
  ShoppingCart,
  Sparkles,
  Star,
  Target,
  Trophy,
  TrendingUp,
  Users,
  Video,
  Waves,
  Wind,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Bullet {
  Icon: LucideIcon;
  text: string;
  highlight?: boolean;
}

interface SectionIntroConfig {
  title: string;
  tagline: string;
  bullets: Bullet[];
}

const SECTION_CONTENT: Record<string, SectionIntroConfig> = {
  community: {
    title: "Welcome to Community",
    tagline: "Your people are here — connect, share, and lift each other up.",
    bullets: [
      { Icon: Edit, text: "Post text, photos, or questions to the community feed" },
      { Icon: MessageCircle, text: "Reply to threads and start conversations in any topic" },
      { Icon: Heart, text: "Like posts and save your favorites to revisit later" },
      { Icon: Users, text: "Add members to your WELL Tribe and send direct messages to cheer them on" },
      { Icon: Waves, text: "Browse trending topics and featured community discussions" },
      { Icon: Star, text: "Earn 10 pts for posting • 5 pts for commenting", highlight: true },
    ],
  },
  wellness: {
    title: "Welcome to Wellness",
    tagline: "Your daily habits, tracked and celebrated.",
    bullets: [
      { Icon: Activity, text: "Tap WELL Check (in your Profile) to log daily activities and earn points" },
      { Icon: Dumbbell, text: "Log resistance training, cardio, stretching, and breathwork" },
      { Icon: Moon, text: "Track your sleep quality and hours each morning" },
      { Icon: TrendingUp, text: "Build streaks — the longer you keep it up, the stronger you become" },
      { Icon: Target, text: "Take on daily and weekly challenges for bonus points" },
      { Icon: Star, text: "Earn 15–20 pts per activity logged", highlight: true },
    ],
  },
  classes: {
    title: "Welcome to Classes",
    tagline: "Move your body — on your schedule.",
    bullets: [
      { Icon: Play, text: "On-demand Zumba® and Fitness Bellydance classes with Loretta" },
      { Icon: Calendar, text: "New classes drop every week — always something fresh" },
      { Icon: Video, text: "Join live-stream sessions when Loretta goes live" },
      { Icon: Search, text: "Filter classes by type, length, or intensity level" },
      { Icon: Bookmark, text: "Bookmark your favorites so they're easy to find again" },
      { Icon: Star, text: "Earn 20 pts per class watched (up to 3 per day)", highlight: true },
    ],
  },
  music: {
    title: "Welcome to Music",
    tagline: "Songs made just for you — only on WELL Collective.",
    bullets: [
      { Icon: Music, text: "Playlist tab: Loretta's original songs, exclusive to this app" },
      { Icon: Search, text: "Search by topic or mood to find exactly the right vibe" },
      { Icon: Heart, text: "Tap the heart on any song to add it to your Favorites playlist" },
      { Icon: BookOpen, text: "Tap a song to view the full lyrics while you listen" },
      { Icon: Waves, text: "Peaceful Sounds tab: ambient tracks for meditation, sleep & focus" },
      { Icon: Wind, text: "Breathwork tab: guided daily sessions + extended breathwork exercises" },
      { Icon: Star, text: "Earn 5 pts per song played (up to 5 songs per day)", highlight: true },
    ],
  },
  events: {
    title: "Welcome to Events",
    tagline: "Don't miss a moment — live sessions, workshops & more.",
    bullets: [
      { Icon: Calendar, text: "Browse upcoming live events, workshops, and members-only sessions" },
      { Icon: LayoutList, text: "Switch between calendar view and list view at the top" },
      { Icon: CalendarDays, text: "Add events to your device calendar so you never miss one" },
      { Icon: Cake, text: "See community member birthdays on the calendar" },
      { Icon: Globe, text: "WELL Escapes — our exclusive retreats — appear here first. Register ahead of time!" },
      { Icon: Star, text: "Earn 25 pts for attending an event • 100 pts for a WELL Escape!", highlight: true },
    ],
  },
  inspiration: {
    title: "Welcome to Inspirations",
    tagline: "Daily wisdom aligned with this week's theme.",
    bullets: [
      { Icon: Sparkles, text: "A new theme every week — daily inspirations follow that theme all week" },
      { Icon: LayoutList, text: "Browse Daily, Weekly, and Motivational inspiration types" },
      { Icon: Heart, text: "Save inspirations that speak to you and revisit them anytime" },
      { Icon: Share2, text: "Tap Share to create a branded card and post to Instagram or Facebook" },
      { Icon: Rss, text: "Words chosen personally by Loretta throughout the year" },
      { Icon: Star, text: "Earn 5 pts for opening the blog + inspiration page", highlight: true },
    ],
  },
  nutrition: {
    title: "Welcome to Nutrition",
    tagline: "Eat well, plan ahead, and nourish yourself.",
    bullets: [
      { Icon: ChefHat, text: "Daily recipe inspired by this week's wellness theme" },
      { Icon: CalendarDays, text: "Meal Plan: map out breakfast, lunch, dinner & snacks for the week" },
      { Icon: ShoppingCart, text: "Auto-generate a shopping list from your planned meals" },
      { Icon: CheckCircle2, text: "Check off shopping list items as you shop" },
      { Icon: Activity, text: "Log meals and track protein, vegetables, hydration & whole foods" },
      { Icon: BookOpen, text: "Scroll to the bottom of the page to browse previous recipes" },
      { Icon: Star, text: "Earn 10 pts for logging each meal", highlight: true },
    ],
  },
  blog: {
    title: "Welcome to the Blog",
    tagline: "Fresh reads, real talk, and Loretta's latest insights.",
    bullets: [
      { Icon: Pencil, text: "Loretta's personal blog posts — stories, advice, and behind-the-scenes" },
      { Icon: BookOpen, text: "Each post opens in a full reader — no leaving the app" },
      { Icon: Bookmark, text: "Bookmark posts to save them for later reading" },
      { Icon: CalendarDays, text: "New content added regularly alongside the weekly theme" },
      { Icon: Star, text: "Earn 5 pts for each blog post you read", highlight: true },
    ],
  },
  "well-cup": {
    title: "Welcome to the WELL Cup",
    tagline: "Every good habit earns you points — and prizes.",
    bullets: [
      { Icon: LayoutList, text: "Today's leaderboard shows who's earning the most points right now" },
      { Icon: Clock, text: "Points reset daily at midnight UTC (7 PM Eastern • 4 PM Pacific • 6 PM Central)" },
      { Icon: Trophy, text: "Top daily earner wins the WELL Cup trophy for that day" },
      { Icon: CalendarDays, text: "Monthly winner earns a FREE month of WELL Collective!" },
      { Icon: Globe, text: "Yearly winner wins a FREE WELL Escape retreat!" },
      { Icon: Lightbulb, text: "Open the app, post, log meals, take classes, do breathwork — it all counts" },
    ],
  },
  profile: {
    title: "Welcome to Your Profile",
    tagline: "Make it yours — your space in the WELL community.",
    bullets: [
      { Icon: Camera, text: "Add a profile photo — earn 15 bonus points when you do!" },
      { Icon: Edit, text: "Write a short bio so your community knows who you are" },
      { Icon: Cake, text: "Set your birthday to get a special celebration on your day" },
      { Icon: Award, text: "Earn badges for hitting milestones — pick one to feature on your avatar" },
      { Icon: Users, text: "Manage your WELL Tribe — add people, message them, cheer each other on" },
      { Icon: Activity, text: "Access your WELL Check here to log daily activities and earn points" },
    ],
  },
};

export default function SectionIntroModal({ sectionKey }: { sectionKey: string }) {
  const storageKey = `well-section-intro-${sectionKey}-v2`;
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) {
      setShow(true);
    }
  }, [storageKey]);

  if (!show) return null;

  const config = SECTION_CONTENT[sectionKey];
  if (!config) return null;

  const dismiss = () => {
    localStorage.setItem(storageKey, "1");
    setShow(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 animate-fade-in-up"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-sm gradient-brand p-[1px] rounded-card animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-surface rounded-card p-5 flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-text">{config.title}</h2>
              <p className="text-xs text-text-muted mt-0.5">{config.tagline}</p>
            </div>
            <button
              onClick={dismiss}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-muted shrink-0"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {config.bullets.map((b, i) => {
              const BulletIcon = b.Icon;
              return (
                <div key={i} className={`flex items-start gap-3 rounded-card px-3 py-2 ${b.highlight ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-surface-2"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${b.highlight ? "bg-yellow-500/20" : "gradient-brand"}`}>
                    <BulletIcon size={13} className={b.highlight ? "text-yellow-400" : "text-white"} />
                  </div>
                  <p className={`text-sm leading-snug ${b.highlight ? "text-yellow-300 font-semibold" : "text-text-muted"}`}>{b.text}</p>
                </div>
              );
            })}
          </div>

          <button
            onClick={dismiss}
            className="w-full gradient-brand text-white text-sm font-semibold rounded-pill py-3 shadow-glow mt-1"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
