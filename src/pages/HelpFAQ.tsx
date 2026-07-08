import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import TopBar from "../components/layout/TopBar";

interface FAQItem {
  q: string;
  a: string;
}
interface FAQSection {
  title: string;
  emoji: string;
  items: FAQItem[];
}

const FAQ_SECTIONS: FAQSection[] = [
  {
    title: "Points & Scoring",
    emoji: "🏆",
    items: [
      {
        q: "I logged an activity but didn't get points.",
        a: "Most activities award points once per day — logging the same type twice won't double your points. Check your daily total on the Home screen. If an activity was accidentally unchecked, you can re-log it and points will be restored.",
      },
      {
        q: "My points disappeared after refreshing.",
        a: "Points sync with the server over your internet connection. If your connection dropped briefly, pull down to refresh the app. If they still don't appear after a minute, log out from Profile and log back in — your points are saved server-side and will restore.",
      },
      {
        q: "How do I earn the most points each day?",
        a: "Log all 6 WELL Check categories: Nutrition (10 pts/meal), Sleep (20 pts), Breathwork (15 pts), Well Activity or Calm Toolkit (5 pts), Resistance Training (20 pts), Stretching (15 pts), and Cardio (20 pts). Opening the app, watching a class, posting in the community, and maintaining streaks also award bonus points.",
      },
    ],
  },
  {
    title: "Time Zone & Streaks",
    emoji: "🕐",
    items: [
      {
        q: "My streak reset even though I was active. What happened?",
        a: "Points and streaks reset at midnight Eastern Time (ET). If you're in a western US time zone (e.g. Pacific), midnight ET is 9 pm your time — log activities before that cutoff to protect your streak.",
      },
      {
        q: "Why does the app use Eastern Time?",
        a: "WELL Collective is based in the US Eastern time zone, so daily resets align to ET midnight. We recommend logging your activities earlier in the evening if you're in a different time zone.",
      },
      {
        q: "My sleep log shows the wrong date.",
        a: "Sleep logs are stamped with the date you submit them. If you log last night's sleep in the morning, log it the same morning — don't wait until afternoon or it may count for today instead.",
      },
    ],
  },
  {
    title: "Push Notifications",
    emoji: "🔔",
    items: [
      {
        q: "I'm not receiving my morning or evening reminders.",
        a: "On iPhone: go to Settings > WELL Collective > Notifications and confirm Allow Notifications is enabled, and that Alerts and Sounds are on. On Android: Settings > Apps > WELL Collective > Notifications. Also check inside the app at Profile > Notification Settings to confirm your reminders are turned on.",
      },
      {
        q: "Notifications are enabled but still not arriving.",
        a: "If you've reinstalled the app or recently changed phones, your push token may need refreshing. Go to Profile > Notification Settings, turn notifications off, wait 5 seconds, then turn them back on. This registers a fresh token with our servers.",
      },
      {
        q: "Can I choose what time I get notified?",
        a: "Yes — go to Profile > Notification Settings. You can customize your morning reminder time, evening WELL Check reminder, and opt into or out of weekly challenge alerts.",
      },
      {
        q: "I get too many notifications.",
        a: "You can fine-tune exactly which notifications you receive in Profile > Notification Settings. You can disable community alerts, challenge reminders, or WELL Cup updates individually while keeping daily wellness reminders.",
      },
    ],
  },
  {
    title: "Health & Fitness Sync",
    emoji: "⌚",
    items: [
      {
        q: "Which fitness devices and apps are supported?",
        a: "On iPhone, WELL Collective connects to Apple Health, which collects data from Apple Watch and most major trackers including Fitbit, Garmin, and Whoop (via their companion apps syncing to Apple Health). On Android, we connect to Google Health Connect, which works with Fitbit, Samsung Health, and Garmin. Note: tracker data reaches WELL via the platform health store — it's not a direct brand connection.",
      },
      {
        q: "Steps/sleep/workouts aren't syncing automatically.",
        a: "Make sure Health Sync is enabled in Profile > Health Sync. Then check your phone's health app (Health on iPhone, Health Connect on Android) to confirm WELL Collective has read permissions for Steps, Sleep, and Workouts.",
      },
      {
        q: "I enabled Health Sync but my data didn't appear.",
        a: "Sync runs once per calendar day on app open. Tap 'Sync Now' on the Health Sync settings page to force an immediate sync. Your tracker also needs to have synced its data to Apple Health / Health Connect first — check the fitness app itself.",
      },
      {
        q: "Health Sync is missing on my device.",
        a: "Health Sync requires iOS 16+ (iPhone) or Android with Health Connect installed (available free on the Play Store for Android 9+). On web browsers, Health Sync is not available — use the iOS or Android app.",
      },
    ],
  },
  {
    title: "Guided Voice & Audio",
    emoji: "🎙️",
    items: [
      {
        q: "There's no voice during guided calm sessions.",
        a: "Our AI voice guide requires an internet connection for the first load of each session. Once a cue is cached, it plays instantly. Check that your phone is not on silent/vibrate and that media volume is turned up. If you hear nothing at all, try closing and reopening the session.",
      },
      {
        q: "The voice sounds different sometimes.",
        a: "WELL uses ElevenLabs as its primary AI voice, with OpenAI as a backup if ElevenLabs is briefly unavailable. The backup voice is slightly different in pitch and pace. Cues are cached per session, so once a session starts the voice stays consistent throughout.",
      },
      {
        q: "The breathwork audio stops mid-session.",
        a: "Check that your phone screen isn't set to lock too quickly — go to Settings > Display & Brightness > Auto-Lock and set it to 5 minutes or longer. On iPhone, also make sure Low Power Mode is off, as it can throttle background audio.",
      },
      {
        q: "Music in the Breathwork player won't play.",
        a: "Breathwork background music streams from our servers and requires an internet connection unless you've downloaded it offline. To download for offline use, tap the download icon on any track on the Music page.",
      },
    ],
  },
  {
    title: "Nutrition & Barcode Scanner",
    emoji: "🍽️",
    items: [
      {
        q: "The barcode scanner isn't working.",
        a: "Go to your phone's Settings > WELL Collective > Camera and confirm camera access is allowed. Hold the scanner 6–10 inches from the barcode and point it at the barcode on the packaging (not the front of the product). Barcodes on curved or reflective surfaces may need flattening.",
      },
      {
        q: "I scanned a barcode but got no results.",
        a: "Our nutrition database covers the majority of US packaged products via Open Food Facts. Items not found (store brands, regional products, homemade food) can be logged manually using the 'Log Meal' button — enter a description and estimated calories.",
      },
      {
        q: "My calorie total looks wrong or extremely high.",
        a: "If your Energy Out (BMR) appears unusually high, check your profile stats in Profile > Edit Profile. A height entered as 1650 cm instead of 165 cm would produce a calculation over 12,000 kcal. Calories are only displayed when within a healthy range (800–4,500 kcal/day).",
      },
    ],
  },
  {
    title: "Workouts & Completion",
    emoji: "💪",
    items: [
      {
        q: "My workout plan is different every day.",
        a: "This is by design — workout plans rotate daily so you get balanced training: resistance days alternate with cardio, and stretching is included each day. This mirrors evidence-based periodization to reduce injury and build consistency.",
      },
      {
        q: "I accidentally marked my workout complete.",
        a: "Tap the 'Workout Complete ✓ — tap to uncheck' button to undo it. This removes the completion and all associated activity points. You can also uncheck individual activities (resistance, cardio, stretching, breathwork) using their toggle buttons.",
      },
      {
        q: "I unchecked my workout but it came back after refreshing.",
        a: "If this happens, wait 5–10 seconds after unchecking before refreshing — the change needs a moment to sync to the server. The app version from this update includes a local override that should prevent the restored state even on fast refreshes.",
      },
    ],
  },
  {
    title: "Login & Account",
    emoji: "🔐",
    items: [
      {
        q: "I forgot what email I used for my trial.",
        a: "On the login screen, tap 'Free Trial' then 'Already started a trial? Resume it here' and try your most common email addresses. If you're still stuck, email us at support@wellcollective.com and we can look it up.",
      },
      {
        q: "My data isn't showing on a new device.",
        a: "Log in with the same email address you used originally. All your data (points, logs, workout history, breathwork logs) is stored on our servers and will restore automatically after logging in.",
      },
      {
        q: "Can I use WELL Collective on multiple devices?",
        a: "Yes — log in with the same account on any device. Points and activity logs sync server-side. Note that downloaded music for offline use is stored locally and would need to be re-downloaded on a new device.",
      },
    ],
  },
];

function FAQEntry({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 py-3.5 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text leading-snug">{item.q}</p>
        </div>
        <div className="shrink-0 mt-0.5 text-text-dim">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>
      {open && (
        <p className="text-sm text-text-muted leading-relaxed pb-4 pr-6">{item.a}</p>
      )}
    </div>
  );
}

export default function HelpFAQ() {
  return (
    <div className="min-h-screen bg-surface pb-24">
      <TopBar title="Help & FAQ" subtitle="Common questions answered" showBack />
      <div className="px-4 pt-4 space-y-4">
        {FAQ_SECTIONS.map((section) => (
          <div key={section.title} className="glass-card rounded-card px-4 py-2">
            <div className="flex items-center gap-2 py-3 border-b border-border mb-1">
              <span className="text-base leading-none">{section.emoji}</span>
              <p className="text-xs font-bold text-text uppercase tracking-wide">{section.title}</p>
            </div>
            {section.items.map((item) => (
              <FAQEntry key={item.q} item={item} />
            ))}
          </div>
        ))}

        <div className="glass-card rounded-card px-4 py-4 text-center">
          <p className="text-sm font-semibold text-text mb-1">Still need help?</p>
          <p className="text-xs text-text-muted">
            Email us at{" "}
            <a href="mailto:support@wellcollective.com" className="text-brand-light underline">
              support@wellcollective.com
            </a>
            {" "}and we'll get back to you within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
