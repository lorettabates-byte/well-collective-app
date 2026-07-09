import { getBadgeDef } from "../../data/badges";
import { MOOD_STATUSES } from "../../data/moods";

interface AvatarProps {
  src: string;
  alt: string;
  size?: number;
  ring?: boolean;
  badgeId?: string;
  moodStatus?: string | null;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ src, alt, size = 36, ring, badgeId, moodStatus }: AvatarProps) {
  const badge = getBadgeDef(badgeId);
  const badgeSize = Math.max(10, Math.round(size * 0.32));
  const mood = moodStatus ? MOOD_STATUSES.find((m) => m.id === moodStatus) : null;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* Mood status glow ring — rendered as an absolute overlay */}
      {mood && (
        <div
          className={`absolute inset-0 rounded-full pointer-events-none ${mood.pulse ? "animate-pulse" : ""}`}
          style={{
            boxShadow: `0 0 0 2.5px ${mood.color}, 0 0 10px 2px ${mood.color}55`,
          }}
        />
      )}

      {!src ? (
        <div
          className={`rounded-full w-full h-full gradient-brand flex items-center justify-center text-white font-semibold ${
            !mood && ring ? "ring-2 ring-brand-light/40" : ""
          }`}
          style={{ fontSize: size * 0.4 }}
          aria-label={alt}
        >
          {getInitials(alt)}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          className={`rounded-full object-cover w-full h-full ${!mood && ring ? "ring-2 ring-brand-light/40" : ""}`}
        />
      )}

      {badge && (
        <span
          title={badge.label}
          aria-label={badge.label}
          className={`absolute bottom-0 right-0 rounded-full flex items-center justify-center ${badge.color} ring-2 ring-surface`}
          style={{ width: badgeSize, height: badgeSize, fontSize: badgeSize * 0.62, lineHeight: 1 }}
        >
          {badge.icon}
        </span>
      )}

      {/* Mood emoji pip — tiny indicator in top-right corner */}
      {mood && size >= 36 && (
        <span
          className="absolute top-0 right-0 rounded-full bg-surface ring-1 ring-surface flex items-center justify-center"
          style={{ width: badgeSize, height: badgeSize, fontSize: badgeSize * 0.64, lineHeight: 1 }}
          title={mood.label}
        >
          {mood.emoji}
        </span>
      )}
    </div>
  );
}
