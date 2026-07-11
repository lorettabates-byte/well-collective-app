import { Pause, Play, SkipForward, X } from "lucide-react";
import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMusicPlayer } from "../../store/MusicPlayerContext";

export default function MiniPlayer() {
  const { currentSong, isPlaying, togglePlay, handleSkip, stop } = useMusicPlayer();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  // Tracks whether a touch moved enough to be a drag (vs a tap on a button).
  const didDragRef = useRef(false);

  // Hidden on music pages — those pages show their own full-featured player.
  if (!currentSong || pathname.startsWith("/music") || pathname.startsWith("/admin/music")) {
    return null;
  }

  const style: React.CSSProperties = pos
    ? { position: "fixed", left: pos.x, top: pos.y, zIndex: 45 }
    : { position: "fixed", bottom: 88, right: 16, zIndex: 45 };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    const el = playerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragRef.current = { startX: t.clientX, startY: t.clientY, ox: rect.left, oy: rect.top };
    didDragRef.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - dragRef.current.startX;
    const dy = t.clientY - dragRef.current.startY;
    if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    e.preventDefault();
    didDragRef.current = true;
    const x = Math.max(8, Math.min(window.innerWidth - 216, dragRef.current.ox + dx));
    const y = Math.max(8, Math.min(window.innerHeight - 64, dragRef.current.oy + dy));
    setPos({ x, y });
  };

  const onTouchEnd = () => {
    dragRef.current = null;
  };

  return (
    <div
      ref={playerRef}
      style={style}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="flex items-center gap-2 gradient-brand rounded-pill px-3 py-2 w-[208px]"
      style={{ boxShadow: "0 4px 24px -4px rgba(1, 145, 206, 0.65), 0 2px 8px rgba(0,0,0,0.4)" }}
    >
      {/* Song title — tap navigates to music page */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => {
          if (!didDragRef.current) navigate("/music");
        }}
        className="flex-1 min-w-0 text-left"
        aria-label="Open music player"
      >
        <p className="text-xs font-semibold text-white truncate">{currentSong.title}</p>
      </button>

      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="shrink-0 text-white w-7 h-7 flex items-center justify-center"
      >
        {isPlaying ? <Pause size={15} /> : <Play size={15} />}
      </button>

      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => handleSkip(1)}
        aria-label="Next track"
        className="shrink-0 text-white w-7 h-7 flex items-center justify-center"
      >
        <SkipForward size={15} />
      </button>

      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={stop}
        aria-label="Close player"
        className="shrink-0 text-white/60 w-6 h-6 flex items-center justify-center"
      >
        <X size={13} />
      </button>
    </div>
  );
}
