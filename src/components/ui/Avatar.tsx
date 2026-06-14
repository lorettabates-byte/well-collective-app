interface AvatarProps {
  src: string;
  alt: string;
  size?: number;
  ring?: boolean;
}

export default function Avatar({ src, alt, size = 36, ring }: AvatarProps) {
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
