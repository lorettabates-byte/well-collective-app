import { useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import AdminRoute from "./components/AdminRoute";
import MobileShell from "./components/layout/MobileShell";
import GoalsQuestionnaire from "./pages/GoalsQuestionnaire";
import { useApp } from "./store/AppContext";
import Home from "./pages/Home";
import Community from "./pages/Community";
import CategoryThreads from "./pages/CategoryThreads";
import Thread from "./pages/Thread";
import Trending from "./pages/Trending";
import NewThread from "./pages/NewThread";
import NewMessage from "./pages/NewMessage";
import Inspirations from "./pages/Inspirations";
import Events from "./pages/Events";
import Profile from "./pages/Profile";
import MemberProfile from "./pages/MemberProfile";
import Tribe from "./pages/Tribe";
import EditProfile from "./pages/EditProfile";
import Blog from "./pages/Blog";
import Messages from "./pages/Messages";
import VideoLibrary from "./pages/VideoLibrary";
import WellCup from "./pages/WellCup";
import WellCheck from "./pages/WellCheck";
import Wellness from "./pages/Wellness";
import Nutrition from "./pages/Nutrition";
import MealPlan from "./pages/MealPlan";
import Breathwork from "./pages/Breathwork";
import Music from "./pages/Music";
import NotificationSettings from "./pages/NotificationSettings";
import HealthSyncSettings from "./pages/HealthSyncSettings";
import HelpFAQ from "./pages/HelpFAQ";
import Notifications from "./pages/Notifications";
import Admin from "./pages/admin/Admin";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminInspirations from "./pages/admin/AdminInspirations";
import AdminContent from "./pages/admin/AdminContent";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminMusic from "./pages/admin/AdminMusic";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminReferrals from "./pages/admin/AdminReferrals";
import AdminPoints from "./pages/admin/AdminPoints";
import AdminTribe from "./pages/admin/AdminTribe";
import AdminExerciseVideos from "./pages/admin/AdminExerciseVideos";
import { useStaleVersionGuard } from "./utils/staleVersionGuard";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

function App() {
  useStaleVersionGuard();
  const navigate = useNavigate();
  const { user, updateProfile, profileReady } = useApp();
  const [goalsDismissed, setGoalsDismissed] = useState(false);

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const periodKey = user.email
    ? `well-goals-period-${user.email}-${currentPeriod}`
    : null;
  const periodShown = periodKey ? localStorage.getItem(periodKey) === "1" : false;
  // Don't show if: already dismissed this session, no user, already shown this month
  // (localStorage), OR the server confirms they already completed/skipped this month.
  const serverDismissed = !!user.goalsRefreshPeriod && user.goalsRefreshPeriod === currentPeriod;
  // Also gate on profileReady so we don't show before the server's goalsRefreshPeriod has loaded.
  const showGoals = profileReady && !goalsDismissed && !!user.email && !periodShown && !serverDismissed;

  // When the server says they've already seen it this month, stamp localStorage
  // so subsequent renders don't flicker on re-mount.
  useEffect(() => {
    if (serverDismissed && periodKey && !periodShown) {
      localStorage.setItem(periodKey, "1");
    }
  }, [serverDismissed, periodKey, periodShown]);

  const handleDismiss = (opts?: { goalsRefreshPeriod?: string }) => {
    if (periodKey) localStorage.setItem(periodKey, "1");
    if (opts?.goalsRefreshPeriod) {
      updateProfile({ goalsRefreshPeriod: opts.goalsRefreshPeriod });
      // Persist to server so the guard works across devices / localStorage wipes.
      if (user.email && API_URL) {
        fetch(`${API_URL}/api/members/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, name: user.name, goalsRefreshPeriod: opts.goalsRefreshPeriod }),
        }).catch(() => {});
      }
    }
    setGoalsDismissed(true);
  };

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "NAVIGATE" && event.data.url) {
        navigate(event.data.url as string);
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [navigate]);

  return (
    <>
      {showGoals && <GoalsQuestionnaire
        onComplete={() => handleDismiss({ goalsRefreshPeriod: currentPeriod })}
        onSkip={() => handleDismiss({ goalsRefreshPeriod: currentPeriod })}
        currentPeriod={currentPeriod}
      />}
      <MobileShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/new" element={<NewMessage />} />
        <Route path="/new-message" element={<NewMessage />} />
        <Route path="/trending" element={<Trending />} />
        <Route path="/community/:categoryId" element={<CategoryThreads />} />
        <Route path="/community/:categoryId/new" element={<NewThread />} />
        <Route path="/community/:categoryId/:threadId" element={<Thread />} />
        <Route path="/inspirations" element={<Inspirations />} />
        <Route path="/events" element={<Events />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:userId" element={<Messages />} />
        <Route path="/videos" element={<VideoLibrary />} />
        <Route path="/well-cup" element={<WellCup />} />
        <Route path="/well-check" element={<WellCheck />} />
        <Route path="/wellness" element={<Wellness />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/nutrition/meal-plan" element={<MealPlan />} />
        <Route path="/breathwork" element={<Breathwork />} />
        <Route path="/music" element={<Music />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/member/:memberId" element={<MemberProfile />} />
        <Route path="/tribe" element={<Tribe />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/notifications" element={<NotificationSettings />} />
        <Route path="/profile/health-sync" element={<HealthSyncSettings />} />
        <Route path="/profile/help" element={<HelpFAQ />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
        <Route path="/admin/posts" element={<AdminRoute><AdminPosts /></AdminRoute>} />
        <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
        <Route path="/admin/inspirations" element={<AdminRoute><AdminInspirations /></AdminRoute>} />
        <Route path="/admin/content" element={<AdminRoute><AdminContent /></AdminRoute>} />
        <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
        <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
        <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
        <Route path="/admin/music" element={<AdminRoute><AdminMusic /></AdminRoute>} />
        <Route path="/admin/members" element={<AdminRoute><AdminMembers /></AdminRoute>} />
        <Route path="/admin/referrals" element={<AdminRoute><AdminReferrals /></AdminRoute>} />
        <Route path="/admin/points" element={<AdminRoute><AdminPoints /></AdminRoute>} />
        <Route path="/admin/tribe" element={<AdminRoute><AdminTribe /></AdminRoute>} />
        <Route path="/admin/exercise-videos" element={<AdminRoute><AdminExerciseVideos /></AdminRoute>} />
      </Routes>
      </MobileShell>
    </>
  );
}

export default App;
