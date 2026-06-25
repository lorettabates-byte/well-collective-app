import { getBadgeDef } from "../../data/badges";

interface AvatarProps {
  src: string;
  alt: string;
  size?: number;
  ring?: boolean;
  badgeId?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ src, alt, size = 36, ring, badgeId }: AvatarProps) {
  const badge = getBadgeDef(badgeId);
  const badgeSize = Math.max(14, Math.round(size * 0.32));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {!src ? (
        <div
          className={`rounded-full w-full h-full gradient-brand flex items-center justify-center text-white font-semibold ${
            ring ? "ring-2 ring-brand-light/40" : ""
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
          className={`rounded-full object-cover w-full h-full ${ring ? "ring-2 ring-brand-light/40" : ""}`}
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
    </div>
  );
}
