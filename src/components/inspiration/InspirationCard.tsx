import { Bookmark, Heart, Share2 } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../../store/AppContext";
import type { Inspiration, InspirationCadence } from "../../types";
import { timeAgo } from "../../utils/format";
import ShareCardModal from "../ShareCardModal";

const CADENCE_LABEL: Record<InspirationCadence, string> = {
  daily: "Daily Inspiration",
  weekly: "Weekly Focus",
  motivational: "Motivation Boost",
};

// Subtle per-cadence background tint so the feed isn't visually flat when all
// three types appear together on the same page.
const CADENCE_BG: Record<InspirationCadence, string> = {
  daily: "bg-gradient-to-br from-surface to-[#11243d]",
  weekly: "bg-gradient-to-br from-surface to-[#1a1f3d]",
  motivational: "bg-gradient-to-br from-surface to-[#2a1f30]",
};

interface InspirationCardProps {
  inspiration: Inspiration;
  compact?: boolean;
}

export default function InspirationCard({ inspiration, compact }: InspirationCardProps) {
  const { user, toggleInspirationLike, toggleInspirationSave } = useApp();
  const hasLiked = inspiration.likes.includes(user.id);
  const hasSaved = inspiration.savedBy.includes(user.id);
  const [showShareCard, setShowShareCard] = useState(false);

  return (
    <div className="gradient-brand p-[1px] rounded-card animate-fade-in-up">
      <div className={`${CADENCE_BG[inspiration.cadence]} rounded-card p-4`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-light">
            {CADENCE_LABEL[inspiration.cadence]}
          </span>
          <span className="text-[11px] text-text-dim">{timeAgo(inspiration.sentAt)}</span>
        </div>
        <h3 className="text-base font-bold text-text mb-1.5">{inspiration.title}</h3>
        {!compact && <p className="text-sm text-text-muted leading-relaxed mb-3">{inspiration.body}</p>}
        {compact && <p className="text-sm text-text-muted leading-relaxed line-clamp-2 mb-3">{inspiration.body}</p>}

        <div className="flex items-center gap-4">
          <button
            onClick={() => toggleInspirationLike(inspiration.id)}
            className="flex items-center gap-1.5 text-xs font-medium text-text-muted"
          >
            <Heart size={16} className={hasLiked ? "fill-brand-light text-brand-light" : ""} />
            {inspiration.likes.length}
          </button>
          <button
            onClick={() => toggleInspirationSave(inspiration.id)}
            className="flex items-center gap-1.5 text-xs font-medium text-text-muted"
          >
            <Bookmark size={16} className={hasSaved ? "fill-brand-light text-brand-light" : ""} />
            {hasSaved ? "Saved" : "Save"}
          </button>
          <button
            onClick={() => setShowShareCard(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-text-muted ml-auto"
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>

      {showShareCard && createPortal(
        <ShareCardModal
          cadenceLabel={CADENCE_LABEL[inspiration.cadence]}
          title={inspiration.title}
          body={inspiration.body}
          userAvatar={user.avatar}
          userName={user.name}
          recipeImage={inspiration.image}
          onClose={() => setShowShareCard(false)}
        />,
        document.body
      )}
    </div>
  );
}
