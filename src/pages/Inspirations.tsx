import { ArrowUpRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import InspirationCard from "../components/inspiration/InspirationCard";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";

type Filter = "all" | "daily-motivation" | "weekly" | "note" | "saved";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "daily-motivation", label: "Daily & Motivation" },
  { id: "weekly", label: "Weekly" },
  { id: "note", label: "Notes from Loretta" },
  { id: "saved", label: "Saved" },
];

const VALID_FILTERS = new Set(FILTERS.map((f) => f.id));

export default function Inspirations() {
  const { user, inspirations } = useApp();
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get("filter");
  const [filter, setFilter] = useState<Filter>(
    initialFilter && VALID_FILTERS.has(initialFilter as Filter) ? (initialFilter as Filter) : "all"
  );

  const filtered = inspirations
    .filter((insp) => {
      if (filter === "all") return true;
      if (filter === "saved") return insp.savedBy.includes(user.id);
      if (filter === "daily-motivation") return insp.cadence === "daily" || insp.cadence === "motivational";
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

        <a
          href="https://lorettabates.com/30-day-life-lift/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 glass-card rounded-card px-4 py-3.5 mt-4 mb-6"
        >
          <div className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0 text-brand-light">
            <Sparkles size={16} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text">Want more inspiration?</p>
            <p className="text-xs text-text-muted">
              Download Loretta's 30 Day Life Lift free using the code: <span className="font-semibold text-brand-light">LIFELIFTED</span>
            </p>
          </div>
          <ArrowUpRight size={16} className="text-text-dim shrink-0" />
        </a>
      </div>
    </div>
  );
}
