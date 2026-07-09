import { Info, Loader2, Play, X } from "lucide-react";
import { useState } from "react";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface ExerciseInfoModalProps {
  name: string;
  meta: string;
  description: string;
  onClose: () => void;
}

export default function ExerciseInfoModal({ name, meta, description, onClose }: ExerciseInfoModalProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const handleWatch = async () => {
    if (videoUrl) { setShowVideo(true); return; }
    if (!API_URL) return;
    setVideoLoading(true);
    setVideoError(false);
    try {
      const res = await fetch(`${API_URL}/api/pixabay/video?q=${encodeURIComponent(name)}`);
      const d = await res.json() as { url?: string | null };
      if (d.url) {
        setVideoUrl(d.url);
        setShowVideo(true);
      } else {
        setVideoError(true);
      }
    } catch {
      setVideoError(true);
    } finally {
      setVideoLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-6 animate-fade-in-up"
      onClick={onClose}
    >
      <div className="relative w-full max-w-sm gradient-brand p-[1px] rounded-card" onClick={(e) => e.stopPropagation()}>
        <div className="bg-surface rounded-card p-6 animate-pop-in">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-muted"
            aria-label="Close"
          >
            <X size={14} />
          </button>

          <div className="w-11 h-11 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-3">
            <Info size={20} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
          </div>

          <h2 className="text-lg font-bold text-text mb-0.5">{name}</h2>
          <p className="text-xs font-semibold text-brand-light mb-3">{meta}</p>
          <p className="text-sm text-text-muted leading-relaxed mb-4">{description}</p>

          {/* Video section */}
          {showVideo && videoUrl ? (
            <div className="rounded-card overflow-hidden bg-black">
              <video
                src={videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full max-h-52 object-cover"
              />
            </div>
          ) : (
            <button
              onClick={handleWatch}
              disabled={videoLoading}
              className="flex items-center justify-center gap-2 w-full text-xs font-semibold gradient-brand text-white rounded-pill py-2.5 disabled:opacity-60"
            >
              {videoLoading
                ? <><Loader2 size={13} className="animate-spin" /> Finding video…</>
                : <><Play size={13} /> Watch Demo</>
              }
            </button>
          )}

          {videoError && (
            <p className="text-[11px] text-text-muted text-center mt-2">No video found for this exercise.</p>
          )}
        </div>
      </div>
    </div>
  );
}
