import { toPng } from "html-to-image";
import { AlertCircle, Download, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { LOGO_URL } from "./layout/MobileShell";

interface ShareCardModalProps {
  cadenceLabel: string;
  title: string;
  body: string;
  userAvatar?: string;
  userName?: string;
  onClose: () => void;
}

const LORETTA_IMAGE = "https://lorettabates.com/wp-content/uploads/2025/11/Loretta_Bates_Bio.jpg";
const JOIN_URL = "https://lorettabates.com";

export default function ShareCardModal({
  cadenceLabel,
  title,
  body,
  userAvatar,
  userName,
  onClose,
}: ShareCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const renderImage = async () => {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
  };

  // Cross-origin images (the logo, Loretta's photo) can taint the canvas and
  // make toPng() throw — fall back to a text-only share/copy so the buttons
  // always do something instead of silently failing.
  const shareTextOnly = async () => {
    const text = `${title}\n\n${body}\n\nJoin the WELL Collective: ${JOIN_URL}`;
    if (navigator.share) {
      await navigator.share({ title: "WELL Collective", text });
      return;
    }
    await navigator.clipboard.writeText(text);
    setStatus("Image couldn't be generated, so we copied the text instead — paste it into your post.");
  };

  const handleDownload = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const dataUrl = await renderImage();
      if (!dataUrl) throw new Error("no image");
      const link = document.createElement("a");
      link.download = "well-collective-inspiration.png";
      link.href = dataUrl;
      link.click();
    } catch {
      try {
        await shareTextOnly();
      } catch {
        setStatus("Couldn't generate the image right now. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async (platform: "instagram" | "facebook" | "general") => {
    setBusy(true);
    setStatus(null);
    try {
      const dataUrl = await renderImage();
      if (!dataUrl) throw new Error("no image");

      if (platform === "instagram" || platform === "facebook") {
        // Instagram/Facebook: download and user shares manually
        const link = document.createElement("a");
        link.download = "well-collective-inspiration.png";
        link.href = dataUrl;
        link.click();
        setStatus(
          platform === "instagram"
            ? "Image saved! Open Instagram and share it to your story or feed."
            : "Image saved! Open Facebook and share it to your profile."
        );
      } else {
        // General share
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
      }
    } catch (err) {
      // Image generation failed (likely a cross-origin image tainting the
      // canvas) — fall back to sharing/copying the text instead.
      try {
        await shareTextOnly();
      } catch {
        if (!(err instanceof Error && err.name === "AbortError")) {
          setStatus("Couldn't generate the image right now. Please try again.");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-6 animate-fade-in-up"
      onClick={onClose}
    >
      <div className="relative w-full max-w-sm flex flex-col gap-4 animate-pop-in z-[10000]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-muted z-10"
          aria-label="Close"
        >
          <X size={14} />
        </button>

        <div ref={cardRef} className="rounded-card p-6 flex flex-col items-center text-center gap-4 w-full" style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          color: '#fff'
        }}>
          {/* WELL Logo */}
          <img src={LOGO_URL} alt="WELL Collective" className="h-12" crossOrigin="anonymous" />

          {/* Loretta Image */}
          <img
            src={LORETTA_IMAGE}
            alt="Loretta Bates"
            crossOrigin="anonymous"
            className="w-24 h-24 rounded-full object-cover border-4 border-[#0191CE] shadow-lg"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />

          {/* Branding */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#84D8FD] mb-1">{cadenceLabel}</p>
            <h2 className="text-lg font-bold text-white leading-snug">{title}</h2>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-300 leading-relaxed max-w-xs">{body}</p>

          {/* User Avatar (if available) */}
          {userAvatar && (
            <div className="flex flex-col items-center gap-2">
              <img
                src={userAvatar}
                alt={userName}
                crossOrigin="anonymous"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#0191CE]"
              />
              <p className="text-xs font-semibold text-[#84D8FD]">{userName}</p>
            </div>
          )}

          {/* Branding Footer */}
          <div className="w-full pt-3 border-t border-[#0191CE]/30">
            <p className="text-sm font-bold text-[#0191CE]">WELL COLLECTIVE</p>
            <p className="text-xs font-semibold text-[#84D8FD]">with Loretta Bates</p>
            <p className="text-[10px] text-gray-400 mt-1">lorettabates.com</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-col">
          {status && (
            <div className="flex items-start gap-2 bg-surface-2 border border-border rounded-card px-3 py-2.5">
              <AlertCircle size={14} className="text-brand-light shrink-0 mt-0.5" />
              <p className="text-xs text-text-muted">{status}</p>
            </div>
          )}
          <button
            onClick={handleDownload}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 text-sm font-semibold text-white gradient-brand rounded-pill py-3 disabled:opacity-60 w-full"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download Image
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleShare("instagram")}
              disabled={busy}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-text border border-border rounded-pill py-2.5 disabled:opacity-60"
            >
              📱 Instagram/TikTok
            </button>
            <button
              onClick={() => handleShare("facebook")}
              disabled={busy}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-text border border-border rounded-pill py-2.5 disabled:opacity-60"
            >
              👥 Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
