import { ChevronRight, Mail, Users } from "lucide-react";
import { Link } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import Avatar from "../components/ui/Avatar";
import SectionHeader from "../components/ui/SectionHeader";
import { CategoryIcon } from "../data/iconMap";
import { useApp } from "../store/AppContext";

export default function NewMessage() {
  const { user, categories, threads } = useApp();

  const members = Array.from(
    new Map(
      threads
        .flatMap((t) => t.messages)
        .filter((m) => m.authorId !== user.id)
        .map((m) => [m.authorId, { id: m.authorId, name: m.authorName, avatar: m.authorAvatar }])
    ).values()
  );

  return (
    <div>
      <TopBar title="New Message" subtitle="Post to the community or message someone privately" showBack />
      <div className="px-4 pt-4 flex flex-col gap-6">
        <div>
          <SectionHeader title="Post to the Community" />
          <div className="flex flex-col gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/community/${category.id}/new`}
                className="flex items-center gap-3 glass-card rounded-card p-4"
              >
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0"
                  style={{ backgroundColor: `${category.color}22` }}
                >
                  <CategoryIcon icon={category.icon} size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-text">{category.name}</h3>
                  <p className="text-xs text-text-muted line-clamp-1">{category.description}</p>
                </div>
                <ChevronRight size={18} className="text-text-dim shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader title="Send a Private Message" />
          {members.length === 0 ? (
            <div className="glass-card rounded-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0">
                <Users size={18} className="text-text-muted" />
              </div>
              <p className="text-xs text-text-muted">
                Once other members post in the community, you'll be able to message them here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {members.map((member) => (
                <Link
                  key={member.id}
                  to={`/messages/${member.id}`}
                  className="flex items-center gap-3 glass-card rounded-card p-4"
                >
                  <Avatar src={member.avatar} alt={member.name} size={40} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-text">{member.name}</h3>
                  </div>
                  <Mail size={16} className="text-text-dim shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
