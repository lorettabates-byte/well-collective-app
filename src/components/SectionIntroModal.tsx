import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface Bullet {
  emoji: string;
  text: string;
}

interface SectionIntroConfig {
  icon: string;
  title: string;
  tagline: string;
  bullets: Bullet[];
}

const SECTION_CONTENT: Record<string, SectionIntroConfig> = {
  community: {
    icon: "💬",
    title: "Welcome to Community",
    tagline: "Your people are here — connect, share, and lift each other up.",
    bullets: [
      { emoji: "📝", text: "Post text, photos, or questions to the community feed" },
      { emoji: "💬", text: "Reply to threads and start conversations in any topic category" },
      { emoji: "❤️", text: "Like posts and save your favorites to revisit later" },
      { emoji: "👥", text: "Add members to your WELL Tribe for direct messaging" },
      { emoji: "🔔", text: "Get notified when someone replies to your post" },
      { emoji: "⭐", text: "Earn 10 pts for posting • 5 pts for commenting" },
    ],
  },
  wellness: {
    icon: "🌊",
    title: "Welcome to Wellness",
    tagline: "Your daily habits, tracked and celebrated.",
    bullets: [
      { emoji: "✅", text: "Check in daily on the WELL Check to log your activities and earn points" },
      { emoji: "🏋️", text: "Log resistance training, cardio, stretching, and breathwork" },
      { emoji: "😴", text: "Track sleep quality and hours each morning" },
      { emoji: "🔥", text: "Build streaks — the longer your streak, the more motivation you build" },
      { emoji: "📋", text: "Take on daily and weekly challenges for bonus points" },
      { emoji: "⭐", text: "Earn 15–20 pts per activity logged" },
    ],
  },
  classes: {
    icon: "🎥",
    title: "Welcome to Classes",
    tagline: "Move your body — on your schedule.",
    bullets: [
      { emoji: "💃", text: "On-demand Zumba® and Fitness Bellydance classes with Loretta" },
      { emoji: "📅", text: "New classes drop every week — always something fresh" },
      { emoji: "🔴", text: "Join live-stream sessions when Loretta goes live" },
      { emoji: "🔍", text: "Filter classes by type, length, or intensity" },
      { emoji: "📌", text: "Bookmark favorites so they're easy to find again" },
      { emoji: "⭐", text: "Earn 20 pts per class watched (up to 3 per day)" },
    ],
  },
  music: {
    icon: "🎵",
    title: "Welcome to Music",
    tagline: "Songs made just for you — only on WELL Collective.",
    bullets: [
      { emoji: "🎶", text: "Playlist tab: browse Loretta's original songs exclusive to this app" },
      { emoji: "🔍", text: "Search by topic or mood to find exactly the right vibe" },
      { emoji: "❤️", text: "Tap the heart on any song to add it to your personal Favorites" },
      { emoji: "📖", text: "Tap a song to view the full lyrics while you listen" },
      { emoji: "🌊", text: "Peaceful Sounds tab: ambient tracks for meditation, sleep, and focus" },
      { emoji: "🌬️", text: "Breathwork tab: guided daily sessions + extended breathwork exercises" },
      { emoji: "⭐", text: "Earn 5 pts per song played (up to 5 songs per day)" },
    ],
  },
  events: {
    icon: "📅",
    title: "Welcome to Events",
    tagline: "Don't miss a moment — live sessions, workshops & more.",
    bullets: [
      { emoji: "📆", text: "Browse upcoming live events, workshops, and members-only sessions" },
      { emoji: "🗓️", text: "Switch between calendar view and list view" },
      { emoji: "🔔", text: "Add events to your device calendar so you never miss one" },
      { emoji: "🎂", text: "See community birthdays on the calendar too" },
      { emoji: "🌴", text: "WELL Escapes — our exclusive retreat events — show up here first" },
      { emoji: "⭐", text: "Earn 25 pts for attending an event" },
    ],
  },
  inspiration: {
    icon: "✨",
    title: "Welcome to Inspirations",
    tagline: "Daily wisdom aligned with this week's theme.",
    bullets: [
      { emoji: "🗓️", text: "A new theme drops every week — daily inspirations follow that theme all week" },
      { emoji: "💙", text: "Daily, Weekly, and Motivational inspiration types — browse them all" },
      { emoji: "❤️", text: "Save inspirations that speak to you and revisit them anytime" },
      { emoji: "📤", text: "Tap Share to create a branded card and post to Instagram or Facebook" },
      { emoji: "🎙️", text: "Words chosen personally by Loretta throughout the year" },
      { emoji: "⭐", text: "Earn 5 pts for opening the blog + inspiration page" },
    ],
  },
  nutrition: {
    icon: "🥗",
    title: "Welcome to Nutrition",
    tagline: "Eat well, plan ahead, and nourish yourself.",
    bullets: [
      { emoji: "🍽️", text: "Daily recipe inspired by this week's wellness theme" },
      { emoji: "📅", text: "Meal Plan: map out breakfast, lunch, dinner, and snacks for the whole week" },
      { emoji: "🛒", text: "Auto-generate a shopping list from your planned meals" },
      { emoji: "✅", text: "Check off shopping list items as you shop" },
      { emoji: "📊", text: "Log meals and track your protein, vegetables, hydration, and whole foods" },
      { emoji: "⭐", text: "Earn 10 pts for logging each meal" },
    ],
  },
  blog: {
    icon: "📰",
    title: "Welcome to the Blog",
    tagline: "Fresh reads, real talk, and Loretta's latest insights.",
    bullets: [
      { emoji: "✍️", text: "Loretta's personal blog posts — stories, advice, and behind-the-scenes" },
      { emoji: "🔗", text: "Each post opens in a full reader view — no leaving the app" },
      { emoji: "📌", text: "Bookmark posts to save them for later reading" },
      { emoji: "📅", text: "New content added regularly alongside the weekly theme" },
      { emoji: "⭐", text: "Earn 5 pts for opening the blog" },
    ],
  },
  "well-cup": {
    icon: "🏆",
    title: "Welcome to the WELL Cup",
    tagline: "Every good habit earns you points — and prizes.",
    bullets: [
      { emoji: "📊", text: "Today's leaderboard shows who's earning the most points right now" },
      { emoji: "⭐", text: "Points reset each day at midnight — a fresh start every morning" },
      { emoji: "🥇", text: "Top daily earner wins the WELL Cup trophy for that day" },
      { emoji: "📅", text: "Monthly winner gets a FREE month of WELL Collective!" },
      { emoji: "🌴", text: "Yearly winner wins a FREE WELL Escape retreat!" },
      { emoji: "💡", text: "Open the app, post, log meals, take classes, do breathwork — it all counts" },
    ],
  },
  profile: {
    icon: "👤",
    title: "Welcome to Your Profile",
    tagline: "Make it yours — your space in the WELL community.",
    bullets: [
      { emoji: "📷", text: "Add a profile photo — earn 15 bonus points when you do!" },
      { emoji: "✍️", text: "Write a short bio so your community knows who you are" },
      { emoji: "🎂", text: "Set your birthday to get a special celebration on your day" },
      { emoji: "🏅", text: "Earn badges for hitting milestones — pick one to feature on your avatar" },
      { emoji: "👥", text: "Manage your WELL Tribe — add people, send messages, cheer each other on" },
      { emoji: "🔔", text: "Customize notification settings so you only get what matters to you" },
    ],
  },
};

export default function SectionIntroModal({ sectionKey }: { sectionKey: string }) {
  const storageKey = `well-section-intro-${sectionKey}`;
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 animate-fade-in-up"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-lg bg-surface border-t border-border rounded-t-2xl p-5 pb-8 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <h2 className="text-base font-bold text-text">{config.title}</h2>
              <p className="text-xs text-text-muted">{config.tagline}</p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-muted shrink-0"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          {config.bullets.map((b, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="text-base leading-none mt-0.5 shrink-0">{b.emoji}</span>
              <p className="text-sm text-text-muted leading-snug">{b.text}</p>
            </div>
          ))}
        </div>

        <button
          onClick={dismiss}
          className="w-full gradient-brand text-white text-sm font-semibold rounded-pill py-3 shadow-glow"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
