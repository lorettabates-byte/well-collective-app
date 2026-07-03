import { toPng } from "html-to-image";
import { AlertCircle, Download, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ShareCardModalProps {
  cadenceLabel: string;
  title: string;
  body: string;
  userAvatar?: string;
  userName?: string;
  recipeImage?: string;
  onClose: () => void;
}

const LORETTA_IMAGE = "https://lorettabates.com/wp-content/uploads/2025/11/Loretta_Bates_Bio.jpg";
const WELL_LOGO = "https://lorettabates.com/wp-content/uploads/2025/11/WELL-Logo-white.png";
const JOIN_URL = "https://lorettabates.com";

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function ShareCardModal({
  cadenceLabel,
  title,
  body,
  userAvatar,
  userName,
  recipeImage,
  onClose,
}: ShareCardModalProps) {
  const cardRefSquare = useRef<HTMLDivElement>(null);
  const cardRefVertical = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [lorrettaImageDataUrl, setLorrettaImageDataUrl] = useState<string | null>(null);
  const [wellLogoDataUrl, setWellLogoDataUrl] = useState<string | null>(null);
  const [recipeImageDataUrl, setRecipeImageDataUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchImageAsDataUrl(LORETTA_IMAGE).then(setLorrettaImageDataUrl);
    fetchImageAsDataUrl(WELL_LOGO).then(setWellLogoDataUrl);
    if (recipeImage) {
      fetchImageAsDataUrl(recipeImage).then(setRecipeImageDataUrl);
    }
  }, [recipeImage]);

  const renderImage = async (format: "square" | "vertical" = "square") => {
    const cardRef = format === "square" ? cardRefSquare : cardRefVertical;
    if (!cardRef.current) return null;
    const images = cardRef.current.querySelectorAll("img");
    const imagePromises = Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        })
    );
    await Promise.all(imagePromises);
    return toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
  };

  const saveToPhotoLibrary = async (dataUrl: string, filename: string) => {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "WELL Collective",
          text: `${title} — join the WELL Collective. ${JOIN_URL}`,
        });
        return true;
      }
    } catch {
      // Fall back to download
    }
    return false;
  };

  const handleShare = async (platform: "instagram" | "facebook") => {
    setBusy(true);
    setStatus(null);
    try {
      const format = platform === "instagram" ? "vertical" : "square";
      const dataUrl = await renderImage(format);
      if (!dataUrl) throw new Error("no image");

      const filename = `well-collective-${platform}.png`;
      const success = await saveToPhotoLibrary(dataUrl, filename);

      if (success) {
        setStatus(
          platform === "instagram"
            ? "Image saved to camera roll! Open Instagram to share it to your story or feed."
            : "Image saved to camera roll! Open Facebook to share it to your profile."
        );
      } else {
        // Fallback: download
        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        link.click();
        setStatus(
          platform === "instagram"
            ? "Image downloaded! Open Instagram to share it to your story or feed."
            : "Image downloaded! Open Facebook to share it to your profile."
        );
      }
    } catch (err) {
      setStatus("Couldn't generate the image right now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const dataUrl = await renderImage("square");
      if (!dataUrl) throw new Error("no image");
      const link = document.createElement("a");
      link.download = "well-collective-inspiration.png";
      link.href = dataUrl;
      link.click();
      setStatus("Image downloaded to your device!");
    } catch {
      setStatus("Couldn't generate the image right now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const cardContent = (
    <>
      {wellLogoDataUrl && (
        <img
          src={wellLogoDataUrl}
          alt="WELL Collective"
          className="w-36 h-auto object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}

      {recipeImageDataUrl && (
        <img
          src={recipeImageDataUrl}
          alt="Recipe"
          className="w-full h-32 rounded-lg object-cover mb-2"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}

      {lorrettaImageDataUrl && (
        <img
          src={lorrettaImageDataUrl}
          alt="Loretta Bates"
          className="w-24 h-24 rounded-full object-cover border-4 border-[#0191CE] shadow-lg"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#84D8FD] mb-1">{cadenceLabel}</p>
        <h2 className="text-lg font-bold text-white leading-snug">{title}</h2>
      </div>

      <p className="text-sm text-gray-300 leading-relaxed max-w-xs">{body}</p>

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

      <div className="w-full pt-3 border-t border-[#0191CE]/30">
        <p className="text-sm font-bold text-[#0191CE]">WELL COLLECTIVE</p>
        <p className="text-xs font-semibold text-[#84D8FD]">with Loretta Bates</p>
        <p className="text-[10px] text-gray-400 mt-1">lorettabates.com</p>
      </div>
    </>
  );

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

        {/* Square format (for download/facebook preview) */}
        <div
          ref={cardRefSquare}
          className="rounded-card p-6 flex flex-col items-center text-center gap-4 w-full"
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            color: '#fff',
          }}
        >
          {cardContent}
        </div>

        {/* Vertical format (hidden, used for instagram rendering) */}
        <div
          ref={cardRefVertical}
          className="hidden rounded-card p-6 flex flex-col items-center text-center gap-4"
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            color: '#fff',
            width: '540px',
            height: '960px',
            margin: '0 auto',
          }}
        >
          {cardContent}
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
