import { Sparkles } from "lucide-react";
import { useState } from "react";
import InspirationCard from "../components/inspiration/InspirationCard";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import type { InspirationCadence } from "../types";

type Filter = "all" | InspirationCadence | "saved";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "motivational", label: "Motivation" },
  { id: "saved", label: "Saved" },
];

export default function Inspirations() {
  const { user, inspirations } = useApp();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = inspirations
    .filter((insp) => {
      if (filter === "all") return true;
      if (filter === "saved") return insp.savedBy.includes(user.id);
      return insp.cadence === filter;
    })
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt));

  return (
    <div>
      <TopBar title="Inspirations" subtitle="Daily wisdom & encouragement from WELL" icon={Sparkles} iconColor="#0191CE" />
      <div className="px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4 -mx-4 px-4">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`text-xs font-semibold px-4 py-2 rounded-pill whitespace-nowrap transition-colors ${
                filter === id ? "gradient-brand text-white shadow-glow" : "bg-surface-2 text-text-muted border border-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-text-muted">Nothing here yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((inspiration) => (
              <InspirationCard key={inspiration.id} inspiration={inspiration} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
