import TopBar from "../../components/layout/TopBar";
import { useApp } from "../../store/AppContext";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-card rounded-card p-4 text-center">
      <p className="text-2xl font-bold text-text">{value}</p>
      <p className="text-xs text-text-muted mt-1">{label}</p>
    </div>
  );
}

export default function AdminAnalytics() {
  const { categories, threads, inspirations, events } = useApp();

  const totalPosts = threads.length;
  const totalMessages = threads.reduce((sum, t) => sum + t.messages.length, 0);
  const supportGiven = threads.reduce(
    (sum, t) => sum + t.messages.reduce((mSum, m) => mSum + m.likes.length, 0),
    0
  );
  const inspirationLikes = inspirations.reduce((sum, i) => sum + i.likes.length, 0);
  const inspirationSaves = inspirations.reduce((sum, i) => sum + i.savedBy.length, 0);
  const totalRsvps = events.reduce((sum, e) => sum + e.rsvps.length, 0);

  const categoryActivity = categories
    .map((category) => {
      const categoryThreads = threads.filter((t) => t.categoryId === category.id);
      const messages = categoryThreads.reduce((sum, t) => sum + t.messages.length, 0);
      return { category, messages };
    })
    .sort((a, b) => b.messages - a.messages);

  const maxMessages = Math.max(1, ...categoryActivity.map((c) => c.messages));

  return (
    <div>
      <TopBar title="Analytics" subtitle="Community engagement stats" showBack />
      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Total Posts" value={totalPosts} />
          <StatCard label="Total Messages" value={totalMessages} />
          <StatCard label="Support Given" value={supportGiven} />
          <StatCard label="Inspiration Likes" value={inspirationLikes} />
          <StatCard label="Inspirations Saved" value={inspirationSaves} />
          <StatCard label="Event RSVPs" value={totalRsvps} />
        </div>

        <h2 className="text-sm font-bold text-text mb-3">Activity by Category</h2>
        <div className="glass-card rounded-card p-4 flex flex-col gap-3">
          {categoryActivity.map(({ category, messages }) => (
            <div key={category.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text">
                  {category.icon} {category.name}
                </span>
                <span className="text-xs text-text-dim">{messages}</span>
              </div>
              <div className="h-2 rounded-pill bg-surface-2 overflow-hidden">
                <div
                  className="h-full gradient-brand rounded-pill"
                  style={{ width: `${(messages / maxMessages) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
