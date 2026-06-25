import { Plus, UserMinus, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
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

export default function Tribe() {
  const { user } = useApp();
  const [tribe, setTribe] = useState<DirectoryMember[]>([]);
  const [allMembers, setAllMembers] = useState<DirectoryMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const loadTribe = () => {
    if (!API_URL || !user.email) return;
    fetch(`${API_URL}/api/tribe?email=${encodeURIComponent(user.email)}`)
      .then((res) => (res.ok ? res.json() : { tribe: [] }))
      .then((data) => setTribe(data.tribe || []))
      .catch(() => setTribe([]));
  };

  useEffect(() => {
    if (!API_URL || !user.email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/api/tribe?email=${encodeURIComponent(user.email)}`).then((res) =>
        res.ok ? res.json() : { tribe: [] }
      ),
      fetch(`${API_URL}/api/members?excludeEmail=${encodeURIComponent(user.email)}`).then((res) =>
        res.ok ? res.json() : { members: [] }
      ),
    ])
      .then(([tribeData, membersData]) => {
        setTribe(tribeData.tribe || []);
        setAllMembers(membersData.members || []);
      })
      .catch(() => {
        setTribe([]);
        setAllMembers([]);
      })
      .finally(() => setLoading(false));
  }, [user.email]);

  const tribeIds = new Set(tribe.map((m) => m.id));
  const addable = allMembers.filter((m) => !tribeIds.has(m.id));

  const handleAdd = async (memberId: string) => {
    if (!API_URL || !user.email) return;
    setAdding(memberId);
    try {
      const res = await fetch(`${API_URL}/api/tribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, memberId }),
      });
      if (res.ok) {
        loadTribe();
      }
    } catch {
      // no-op, addable list stays as-is so the user can retry
    } finally {
      setAdding(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!API_URL || !user.email) return;
    setTribe((prev) => prev.filter((m) => m.id !== memberId));
    try {
      await fetch(`${API_URL}/api/tribe/${memberId}?email=${encodeURIComponent(user.email)}`, {
        method: "DELETE",
      });
    } catch {
      loadTribe();
    }
  };

  return (
    <div>
      <TopBar title="WELL Tribe" subtitle="The people you've added to your circle" showBack />
      <div className="px-4 pt-4">
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center justify-center gap-2 text-sm font-semibold gradient-brand text-white rounded-pill py-2.5 w-full mb-4"
        >
          {showAdd ? <X size={16} /> : <Plus size={16} />}
          {showAdd ? "Close" : "Add to WELL Tribe"}
        </button>

        {showAdd && (
          <div className="glass-card rounded-card p-3 flex flex-col gap-2 mb-6 max-h-72 overflow-y-auto">
            {addable.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">
                Everyone you know is already in your WELL Tribe.
              </p>
            ) : (
              addable.map((member) => (
                <div key={member.id} className="flex items-center gap-3 px-1 py-1.5">
                  <Avatar src={member.avatar || ""} alt={member.name} size={36} />
                  <p className="flex-1 min-w-0 text-sm font-medium text-text truncate">{member.name}</p>
                  <button
                    onClick={() => handleAdd(member.id)}
                    disabled={adding === member.id}
                    className="text-xs font-semibold gradient-brand text-white rounded-pill px-3 py-1.5 disabled:opacity-50"
                  >
                    {adding === member.id ? "Adding…" : "Add"}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-text-muted text-center py-8">Loading your WELL Tribe…</p>
        ) : tribe.length === 0 ? (
          <div className="glass-card rounded-card p-6 flex flex-col items-center text-center gap-2">
            <Users size={28} className="text-text-dim" />
            <p className="text-sm text-text-muted">
              Your WELL Tribe is empty. Add fellow members to build your circle.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {tribe.map((member) => (
              <div key={member.id} className="glass-card rounded-card px-4 py-3 flex items-center gap-3">
                <Avatar src={member.avatar || ""} alt={member.name} size={40} badgeId={resolveFeaturedBadge(member)} />
                <p className="flex-1 min-w-0 text-sm font-semibold text-text truncate">{member.name}</p>
                <button
                  onClick={() => handleRemove(member.id)}
                  className="text-text-dim p-2 shrink-0"
                  aria-label={`Remove ${member.name} from WELL Tribe`}
                >
                  <UserMinus size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
