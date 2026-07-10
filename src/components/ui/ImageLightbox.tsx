import { Download, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ImageLightboxProps {
  src: string;
  onClose: () => void;
}

export default function ImageLightbox({ src, onClose }: ImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Refs let the non-passive touch listeners read current values without stale closures.
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const pinchStartRef = useRef<{ dist: number; baseScale: number } | null>(null);
  const panStartRef = useRef<{ touchX: number; touchY: number; bx: number; by: number } | null>(null);
  const lastTapRef = useRef(0);

  const applyTransform = (s: number, x: number, y: number) => {
    scaleRef.current = s;
    offsetRef.current = { x, y };
    setScale(s);
    setOffset({ x, y });
  };

  // Keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Non-passive touch listeners for pinch-zoom and pan
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getTouchDist = (touches: TouchList) =>
      Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        pinchStartRef.current = { dist: getTouchDist(e.touches), baseScale: scaleRef.current };
        panStartRef.current = null;
      } else if (e.touches.length === 1) {
        // Double-tap to reset zoom
        const now = Date.now();
        if (now - lastTapRef.current < 300 && scaleRef.current > 1) {
          e.preventDefault();
          applyTransform(1, 0, 0);
          lastTapRef.current = 0;
          return;
        }
        lastTapRef.current = now;
        // Begin pan only when zoomed in
        if (scaleRef.current > 1) {
          panStartRef.current = {
            touchX: e.touches[0].clientX,
            touchY: e.touches[0].clientY,
            bx: offsetRef.current.x,
            by: offsetRef.current.y,
          };
        }
        pinchStartRef.current = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartRef.current) {
        e.preventDefault();
        const newScale = Math.max(1, Math.min(4, pinchStartRef.current.baseScale * (getTouchDist(e.touches) / pinchStartRef.current.dist)));
        scaleRef.current = newScale;
        setScale(newScale);
      } else if (e.touches.length === 1 && panStartRef.current && scaleRef.current > 1) {
        e.preventDefault();
        const x = panStartRef.current.bx + (e.touches[0].clientX - panStartRef.current.touchX);
        const y = panStartRef.current.by + (e.touches[0].clientY - panStartRef.current.touchY);
        offsetRef.current = { x, y };
        setOffset({ x, y });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchStartRef.current = null;
      if (e.touches.length === 0) {
        panStartRef.current = null;
        // Snap back to 1× if barely zoomed
        if (scaleRef.current < 1.15) applyTransform(1, 0, 0);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = `well-photo-${Date.now()}.jpg`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  // Tapping the backdrop resets zoom if zoomed in, closes if already at 1×
  const handleBackdropClick = () => {
    if (scaleRef.current > 1) {
      applyTransform(1, 0, 0);
    } else {
      onClose();
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 touch-none"
      onClick={handleBackdropClick}
    >
      {/* Save — top-left */}
      <button
        onClick={(e) => { e.stopPropagation(); handleSave(); }}
        aria-label="Save image"
        className="absolute top-4 left-4 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-black/70 border border-white/30 text-white"
        style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
      >
        <Download size={18} />
      </button>

      {/* Close — top-right, solid so it's always visible */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close"
        className="absolute top-4 right-4 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-black/70 border border-white/30 text-white"
        style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
      >
        <X size={20} />
      </button>

      <img
        src={src}
        alt="Full size"
        draggable={false}
        className="max-w-full max-h-full object-contain select-none pointer-events-none"
        style={{
          maxHeight: "90vh",
          maxWidth: "95vw",
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "center center",
          transition: scale === 1 ? "transform 0.2s ease" : "none",
        }}
      />
    </div>
  );
}
