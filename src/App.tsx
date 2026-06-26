import { Route, Routes } from "react-router-dom";
import AdminRoute from "./components/AdminRoute";
import MobileShell from "./components/layout/MobileShell";
import Home from "./pages/Home";
import Community from "./pages/Community";
import CategoryThreads from "./pages/CategoryThreads";
import Thread from "./pages/Thread";
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
import Wellness from "./pages/Wellness";
import Nutrition from "./pages/Nutrition";
import Breathwork from "./pages/Breathwork";
import Music from "./pages/Music";
import NotificationSettings from "./pages/NotificationSettings";
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

function App() {
  return (
    <MobileShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/new" element={<NewMessage />} />
        <Route path="/new-message" element={<NewMessage />} />
        <Route path="/community/:categoryId" element={<CategoryThreads />} />
        <Route path="/community/:categoryId/new" element={<NewThread />} />
        <Route path="/community/:categoryId/:threadId" element={<Thread />} />
        <Route path="/inspirations" element={<Inspirations />} />
        <Route path="/events" element={<Events />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:userId" element={<Messages />} />
        <Route path="/videos" element={<VideoLibrary />} />
        <Route path="/wellness" element={<Wellness />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/breathwork" element={<Breathwork />} />
        <Route path="/music" element={<Music />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/member/:memberId" element={<MemberProfile />} />
        <Route path="/tribe" element={<Tribe />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/notifications" element={<NotificationSettings />} />
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
      </Routes>
    </MobileShell>
  );
}

export default App;
