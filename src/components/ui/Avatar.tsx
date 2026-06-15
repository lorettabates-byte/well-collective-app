interface AvatarProps {
  src: string;
  alt: string;
  size?: number;
  ring?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ src, alt, size = 36, ring }: AvatarProps) {
  if (!src) {
    return (
      <div
        className={`rounded-full shrink-0 gradient-brand flex items-center justify-center text-white font-semibold ${
          ring ? "ring-2 ring-brand-light/40" : ""
        }`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        aria-label={alt}
      >
        {getInitials(alt)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover shrink-0 ${ring ? "ring-2 ring-brand-light/40" : ""}`}
      style={{ width: size, height: size }}
    />
  );
}
