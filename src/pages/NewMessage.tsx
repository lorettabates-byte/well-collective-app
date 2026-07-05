import { Mail, Search, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import Avatar from "../components/ui/Avatar";
import { resolveFeaturedBadge } from "../data/badges";
import { useApp } from "../store/AppContext";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface DirectoryMember {
  id: string;
  name: string;
  avatar?: string;
  levelBadge?: string;
  bonusBadges?: string[];
  grantedBadges?: string[];
  featuredBadge?: string;
}

export default function NewMessage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!API_URL || !user.email) {
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/api/members?excludeEmail=${encodeURIComponent(user.email)}`)
      .then((res) => (res.ok ? res.json() : { members: [] }))
      .then((data) => setMembers(data.members || []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [user.email]);

  // Filter members by search query
  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <TopBar title="Start a Conversation" subtitle="Send a private message" showBack />
      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Search bar */}
        {members.length > 0 && (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a person..."
              className="w-full pl-10 pr-10 py-2.5 bg-surface-2 border border-border rounded-pill text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text transition-colors"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Members list */}
        {loading ? (
          <p className="text-xs text-text-muted text-center py-8">Loading members...</p>
        ) : members.length === 0 ? (
          <div className="glass-card rounded-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0">
              <Users size={18} className="text-text-muted" />
            </div>
            <p className="text-xs text-text-muted">
              Once other members join, you'll be able to message them here.
            </p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-text-muted">No members found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredMembers.map((member) => (
                <Link
                  key={member.id}
                  to={`/messages/${member.id}`}
                  className="flex items-center gap-3 glass-card rounded-card p-4"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/member/${member.id}`);
                    }}
                    className="shrink-0"
                  >
                    <Avatar src={member.avatar || ""} alt={member.name} size={40} badgeId={resolveFeaturedBadge(member)} />
                  </button>
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
  );
}
