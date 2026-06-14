import { Route, Routes } from "react-router-dom";
import MobileShell from "./components/layout/MobileShell";
import Home from "./pages/Home";
import Community from "./pages/Community";
import CategoryThreads from "./pages/CategoryThreads";
import Thread from "./pages/Thread";
import NewThread from "./pages/NewThread";
import Inspirations from "./pages/Inspirations";
import Events from "./pages/Events";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Blog from "./pages/Blog";
import VideoLibrary from "./pages/VideoLibrary";
import Workouts from "./pages/Workouts";
import NotificationSettings from "./pages/NotificationSettings";
import Notifications from "./pages/Notifications";
import Admin from "./pages/admin/Admin";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminInspirations from "./pages/admin/AdminInspirations";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

function App() {
  return (
    <MobileShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/:categoryId" element={<CategoryThreads />} />
        <Route path="/community/:categoryId/new" element={<NewThread />} />
        <Route path="/community/:categoryId/:threadId" element={<Thread />} />
        <Route path="/inspirations" element={<Inspirations />} />
        <Route path="/events" element={<Events />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/videos" element={<VideoLibrary />} />
        <Route path="/workouts" element={<Workouts />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/notifications" element={<NotificationSettings />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/posts" element={<AdminPosts />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
        <Route path="/admin/inspirations" element={<AdminInspirations />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
      </Routes>
    </MobileShell>
  );
}

export default App;
