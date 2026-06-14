import { toPng } from "html-to-image";
import { Download, Loader2, Share2, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";

interface ShareCardModalProps {
  cadenceLabel: string;
  title: string;
  body: string;
  onClose: () => void;
}

const JOIN_URL = "https://www.lorettabates.com";

export default function ShareCardModal({ cadenceLabel, title, body, onClose }: ShareCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const renderImage = async () => {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      const dataUrl = await renderImage();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = "well-collective-inspiration.png";
      link.href = dataUrl;
      link.click();
    } catch {
      // ignore export errors
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    setBusy(true);
    try {
      const dataUrl = await renderImage();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "well-collective-inspiration.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "WELL Collective",
          text: `${title} — join the WELL Collective for inspiration like this. ${JOIN_URL}`,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: "WELL Collective",
          text: `${title}\n\n${body}\n\nJoin the WELL Collective: ${JOIN_URL}`,
        });
      } else {
        await handleDownload();
      }
    } catch {
      // user cancelled share
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 animate-fade-in-up"
      onClick={onClose}
    >
      <div className="relative w-full max-w-sm flex flex-col gap-4 animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-muted z-10"
          aria-label="Close"
        >
          <X size={14} />
        </button>

        <div ref={cardRef} className="gradient-brand rounded-card p-7 flex flex-col items-center text-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-white" />
            <span className="text-lg font-extrabold uppercase tracking-[0.15em] text-white">WELL Collective</span>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">{cadenceLabel}</span>
          <h2 className="text-xl font-bold text-white leading-snug">{title}</h2>
          <p className="text-sm text-white/90 leading-relaxed">{body}</p>
          <div className="w-full mt-2 bg-white/15 border border-white/30 rounded-pill py-3 px-4 backdrop-blur-sm">
            <p className="text-sm font-bold text-white">Join the WELL Collective</p>
            <p className="text-[11px] text-white/80 mt-0.5">for daily inspiration like this — lorettabates.com</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-text border border-border rounded-pill py-3 disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Save Image
          </button>
          <button
            onClick={handleShare}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white gradient-brand rounded-pill py-3 shadow-glow disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
