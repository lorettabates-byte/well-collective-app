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

function loadCanvasImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawCircleImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number, cy: number, r: number,
  borderColor: string, borderWidth: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const minD = Math.min(img.width, img.height);
  const sx = (img.width - minD) / 2;
  const sy = (img.height - minD) / 2;
  ctx.drawImage(img, sx, sy, minD, minD, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = borderWidth;
  ctx.stroke();
}

async function generateInstagramCard(params: {
  cadenceLabel: string;
  title: string;
  body: string;
  userAvatar?: string;
  userName?: string;
  lorrettaDataUrl: string | null;
  logoDataUrl: string | null;
  recipeDataUrl: string | null;
}): Promise<string> {
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#1a1a2e");
  grad.addColorStop(1, "#16213e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle decorative rings
  const ring = (cx: number, cy: number, r: number, color: string) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  };
  ring(W * 0.85, H * 0.08, 320, "rgba(1,145,206,0.08)");
  ring(W * 0.1, H * 0.92, 240, "rgba(1,145,206,0.06)");

  const [logoImg, lorrettaImg, avatarImg, recipeImg] = await Promise.all([
    params.logoDataUrl ? loadCanvasImage(params.logoDataUrl) : Promise.resolve(null),
    params.lorrettaDataUrl ? loadCanvasImage(params.lorrettaDataUrl) : Promise.resolve(null),
    params.userAvatar ? loadCanvasImage(params.userAvatar) : Promise.resolve(null),
    params.recipeDataUrl ? loadCanvasImage(params.recipeDataUrl) : Promise.resolve(null),
  ]);

  let y = 140;

  // WELL logo
  if (logoImg) {
    const lh = 80;
    const lw = (logoImg.width / logoImg.height) * lh;
    ctx.drawImage(logoImg, (W - lw) / 2, y, lw, lh);
    y += lh + 70;
  }

  // Recipe image (if present)
  if (recipeImg) {
    const rw = W - 120, rh = 320;
    const rx = 60;
    ctx.save();
    const rad = 24;
    ctx.beginPath();
    ctx.moveTo(rx + rad, y);
    ctx.lineTo(rx + rw - rad, y);
    ctx.arcTo(rx + rw, y, rx + rw, y + rad, rad);
    ctx.lineTo(rx + rw, y + rh - rad);
    ctx.arcTo(rx + rw, y + rh, rx + rw - rad, y + rh, rad);
    ctx.lineTo(rx + rad, y + rh);
    ctx.arcTo(rx, y + rh, rx, y + rh - rad, rad);
    ctx.lineTo(rx, y + rad);
    ctx.arcTo(rx, y, rx + rad, y, rad);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(recipeImg, rx, y, rw, rh);
    ctx.restore();
    y += rh + 60;
  }

  // Loretta circle
  if (lorrettaImg) {
    const r = 130;
    drawCircleImage(ctx, lorrettaImg, W / 2, y + r, r, "#0191CE", 7);
    y += r * 2 + 60;
  }

  // Cadence label
  ctx.fillStyle = "#84D8FD";
  ctx.font = "700 42px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(params.cadenceLabel.toUpperCase(), W / 2, y + 21);
  y += 72;

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 76px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const titleLines = wrapCanvasText(ctx, params.title, W - 120);
  for (const line of titleLines) {
    ctx.fillText(line, W / 2, y);
    y += 88;
  }
  y += 24;

  // Body text
  ctx.fillStyle = "#c8cdd6";
  ctx.font = "400 46px system-ui, -apple-system, sans-serif";
  const bodyLines = wrapCanvasText(ctx, params.body, W - 160);
  for (const line of bodyLines) {
    ctx.fillText(line, W / 2, y);
    y += 60;
  }
  y += 48;

  // User avatar + name
  if (avatarImg && params.userName) {
    const r = 70;
    drawCircleImage(ctx, avatarImg, W / 2, y + r, r, "#0191CE", 4);
    y += r * 2 + 20;
    ctx.fillStyle = "#84D8FD";
    ctx.font = "600 38px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(params.userName, W / 2, y + 20);
    y += 60;
  }

  // Footer
  const footerY = H - 130;
  ctx.fillStyle = "rgba(1,145,206,0.9)";
  ctx.font = "700 38px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("WELL COLLECTIVE", W / 2, footerY);
  ctx.fillStyle = "rgba(132,216,253,0.75)";
  ctx.font = "400 30px system-ui, -apple-system, sans-serif";
  ctx.fillText("with Loretta Bates", W / 2, footerY + 48);
  ctx.fillStyle = "rgba(156,163,175,0.5)";
  ctx.font = "400 26px system-ui, -apple-system, sans-serif";
  ctx.fillText("lorettabates.com", W / 2, footerY + 88);

  return canvas.toDataURL("image/png");
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
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [lorrettaImageDataUrl, setLorrettaImageDataUrl] = useState<string | null>(null);
  const [wellLogoDataUrl, setWellLogoDataUrl] = useState<string | null>(null);
  const [recipeImageDataUrl, setRecipeImageDataUrl] = useState<string | null>(null);
  // Drive the slide-up via inline style + transition so it cannot be cached away
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 20); return () => clearTimeout(t); }, []);

  useEffect(() => {
    fetchImageAsDataUrl(LORETTA_IMAGE).then(setLorrettaImageDataUrl);
    fetchImageAsDataUrl(WELL_LOGO).then(setWellLogoDataUrl);
    if (recipeImage) {
      fetchImageAsDataUrl(recipeImage).then(setRecipeImageDataUrl);
    }
  }, [recipeImage]);

  const renderSquareImage = async () => {
    if (!cardRefSquare.current) return null;
    const images = cardRefSquare.current.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map(
        (img) => new Promise<void>((resolve) => {
          if (img.complete) resolve();
          else { img.onload = () => resolve(); img.onerror = () => resolve(); }
        })
      )
    );
    return toPng(cardRefSquare.current, { pixelRatio: 2, cacheBust: true });
  };

  const saveOrDownload = async (dataUrl: string, filename: string): Promise<boolean> => {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "WELL Collective", text: `${title} - join the WELL Collective. ${JOIN_URL}` });
        return true;
      }
    } catch { /* fall through */ }
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
    return false;
  };

  const handleShare = async (platform: "instagram" | "facebook") => {
    setBusy(true);
    setStatus(null);
    try {
      let dataUrl: string;
      if (platform === "instagram") {
        // Canvas-based generation — reliable on all platforms, no hidden-DOM tricks
        dataUrl = await generateInstagramCard({
          cadenceLabel, title, body, userAvatar, userName,
          lorrettaDataUrl: lorrettaImageDataUrl,
          logoDataUrl: wellLogoDataUrl,
          recipeDataUrl: recipeImageDataUrl,
        });
      } else {
        const img = await renderSquareImage();
        if (!img) throw new Error("no image");
        dataUrl = img;
      }
      const filename = `well-collective-${platform}.png`;
      const shared = await saveOrDownload(dataUrl, filename);
      setStatus(
        platform === "instagram"
          ? shared ? "Saved! Open Instagram to share to your story or feed." : "Downloaded! Open Instagram to share to your story or feed."
          : shared ? "Saved! Open Facebook to share to your profile." : "Downloaded! Open Facebook to share to your profile."
      );
    } catch {
      setStatus("Couldn't generate the image right now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const dataUrl = await renderSquareImage();
      if (!dataUrl) throw new Error("no image");
      const shared = await saveOrDownload(dataUrl, "well-collective-inspiration.png");
      setStatus(shared ? "Image saved to your camera roll!" : "Image downloaded to your device!");
    } catch {
      setStatus("Couldn't generate the image right now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Backdrop — fades in via inline transition, no transform */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.6)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.25s ease",
        }}
      />
      {/* Sheet — slides up from the bottom via inline transition */}
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10000,
          maxHeight: "92vh",
          display: "flex", flexDirection: "column",
          background: "var(--color-surface, #0e1a26)",
          borderRadius: "20px 20px 0 0",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row: drag handle + close */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 16px 8px", position: "relative", flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
          <button
            onClick={onClose}
            style={{ position: "absolute", right: 16, top: 10 }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-muted"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-8">

          {/* Square preview card */}
          <div
            ref={cardRefSquare}
            className="rounded-card p-7 flex flex-col items-center text-center gap-5 w-full"
            style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", color: "#fff" }}
          >
            {wellLogoDataUrl && (
              <img src={wellLogoDataUrl} alt="WELL Collective" className="w-40 h-auto object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
            {recipeImageDataUrl && (
              <img src={recipeImageDataUrl} alt="Recipe" className="w-full h-40 rounded-xl object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
            {lorrettaImageDataUrl && (
              <img src={lorrettaImageDataUrl} alt="Loretta Bates"
                className="w-28 h-28 rounded-full object-cover border-4 border-[#0191CE] shadow-lg"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#84D8FD] mb-1">{cadenceLabel}</p>
              <h2 className="text-xl font-bold text-white leading-snug">{title}</h2>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{body}</p>
            {userAvatar && (
              <div className="flex flex-col items-center gap-2">
                <img src={userAvatar} alt={userName} crossOrigin="anonymous"
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#0191CE]" />
                <p className="text-xs font-semibold text-[#84D8FD]">{userName}</p>
              </div>
            )}
            <div className="w-full pt-3 border-t border-[#0191CE]/30">
              <p className="text-sm font-bold text-[#0191CE]">WELL COLLECTIVE</p>
              <p className="text-xs font-semibold text-[#84D8FD]">with Loretta Bates</p>
              <p className="text-[10px] text-gray-400 mt-1">lorettabates.com</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 flex-col">
            {status && (
              <div className="flex items-start gap-2 bg-surface-2 border border-border rounded-card px-3 py-2.5">
                <AlertCircle size={14} className="text-brand-light shrink-0 mt-0.5" />
                <p className="text-xs text-text-muted">{status}</p>
              </div>
            )}
            <button onClick={handleDownload} disabled={busy}
              className="flex items-center justify-center gap-1.5 text-sm font-semibold text-white gradient-brand rounded-pill py-3.5 disabled:opacity-60 w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download Image
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleShare("instagram")} disabled={busy}
                className="flex items-center justify-center gap-1.5 text-xs font-semibold text-text border border-border rounded-pill py-3 disabled:opacity-60">
                📱 Instagram/TikTok
              </button>
              <button onClick={() => handleShare("facebook")} disabled={busy}
                className="flex items-center justify-center gap-1.5 text-xs font-semibold text-text border border-border rounded-pill py-3 disabled:opacity-60">
                👥 Facebook
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
