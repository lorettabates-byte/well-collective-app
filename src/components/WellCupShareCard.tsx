import { Download, X } from "lucide-react";
import { useState } from "react";

const WELL_LOGO_URL = "https://lorettabates.com/wp-content/uploads/2025/11/WELL-Logo-white.png";
const SITE_URL = "app.lorettabates.com";

export interface ShareWinner {
  name: string;
  avatar: string | null;
  total_points: number;
}

export type SharePeriod = "daily" | "monthly" | "yearly";

interface Props {
  winner: ShareWinner;
  period: SharePeriod;
  periodLabel: string;
  onClose: () => void;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawPillLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  fontSize: number
) {
  ctx.font = `500 ${fontSize}px system-ui, -apple-system, sans-serif`;
  const tw = ctx.measureText(text).width;
  const ph = fontSize * 1.7;
  const pw = tw + fontSize * 1.6;
  drawRoundedRect(ctx, cx - pw / 2, cy - ph / 2, pw, ph, ph / 2);
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy);
}

async function drawProfileCircle(
  ctx: CanvasRenderingContext2D,
  avatarImg: HTMLImageElement | null,
  initials: string,
  cx: number, cy: number, r: number, borderW: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  if (avatarImg) {
    const minD = Math.min(avatarImg.width, avatarImg.height);
    const sx = (avatarImg.width - minD) / 2;
    const sy = (avatarImg.height - minD) / 2;
    ctx.drawImage(avatarImg, sx, sy, minD, minD, cx - r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = "#3a8fc4";
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = "white";
    ctx.font = `500 ${Math.round(r * 0.65)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, cx, cy);
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = borderW;
  ctx.stroke();
}

async function generateCard(
  winner: ShareWinner,
  period: SharePeriod,
  periodLabel: string,
  size: "instagram" | "facebook"
): Promise<string> {
  const isIG = size === "instagram";
  const W = isIG ? 1080 : 1200;
  const H = isIG ? 1920 : 630;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#2a4a7f");
  grad.addColorStop(0.55, "#1e6fa8");
  grad.addColorStop(1, "#6ab8d8");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative rings
  const ring = (cx: number, cy: number, r: number) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  if (isIG) {
    ring(W * 0.88, H * 0.06, 260);
    ring(W * 0.12, H * 0.94, 200);
  } else {
    ring(W * 0.5, -90, 240);
    ring(-80, H + 70, 180);
  }

  // Load images (best-effort; fallback gracefully if CORS blocked)
  const [logoImg, avatarImg] = await Promise.all([
    loadImage(WELL_LOGO_URL).catch(() => null),
    winner.avatar ? loadImage(winner.avatar).catch(() => null) : Promise.resolve(null),
  ]);

  const initials = winner.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const now = new Date();
  const monthYear = now.toLocaleString("default", { month: "long", year: "numeric" });

  if (isIG) {
    // ── Instagram Story (1080 × 1920) ──

    // WELL logo or text fallback
    if (logoImg) {
      const lh = 90;
      const lw = (logoImg.width / logoImg.height) * lh;
      ctx.drawImage(logoImg, (W - lw) / 2, 110, lw, lh);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "500 54px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("WELL COLLECTIVE", W / 2, 165);
    }

    // Trophy emoji
    ctx.font = "210px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🏆", W / 2, H * 0.345);

    // Profile circle
    await drawProfileCircle(ctx, avatarImg, initials, W / 2, H * 0.5, 130, 9);

    // Period label
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "500 46px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(periodLabel.toUpperCase(), W / 2, H * 0.615);

    // Winner name
    ctx.fillStyle = "#ffffff";
    ctx.font = "500 92px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(winner.name, W / 2, H * 0.675);

    // Points
    ctx.fillStyle = "#ffffff";
    ctx.font = "500 124px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(winner.total_points.toLocaleString(), W / 2, H * 0.754);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "400 50px system-ui, sans-serif";
    ctx.fillText("points", W / 2, H * 0.796);

    // Champion pill
    drawPillLabel(ctx, "WELL CUP CHAMPION", W / 2, H * 0.845, 38);

    // Date + site link
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "400 40px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(monthYear, W / 2, H * 0.907);

    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "400 38px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(SITE_URL, W / 2, H * 0.952);

  } else {
    // ── Facebook landscape (1200 × 630) ──
    const leftW = 290;

    // Left column — WELL logo
    if (logoImg) {
      const lh = 52;
      const lw = (logoImg.width / logoImg.height) * lh;
      ctx.drawImage(logoImg, (leftW - lw) / 2, 60, lw, lh);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "500 28px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("WELL COLLECTIVE", leftW / 2, 92);
    }

    // Trophy emoji
    ctx.font = "88px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🏆", leftW / 2, H / 2 - 16);

    // Champion pill (left col)
    drawPillLabel(ctx, "CHAMPION", leftW / 2, H * 0.72, 26);

    // Vertical divider
    ctx.beginPath();
    ctx.moveTo(leftW, 55);
    ctx.lineTo(leftW, H - 55);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Right section text block
    const textX = leftW + 44;

    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "500 24px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${periodLabel.toUpperCase()} · ${monthYear.toUpperCase()}`, textX, H * 0.28);

    ctx.fillStyle = "#ffffff";
    ctx.font = "500 72px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(winner.name, textX, H * 0.46);

    // Points row
    const ptsText = winner.total_points.toLocaleString();
    ctx.fillStyle = "#ffffff";
    ctx.font = "500 82px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(ptsText, textX, H * 0.645);
    const ptsW = ctx.measureText(ptsText).width;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "400 30px system-ui, sans-serif";
    ctx.fillText("points", textX + ptsW + 12, H * 0.645 - 6);

    // WELL Cup Champion pill
    drawPillLabel(ctx, "WELL CUP CHAMPION", textX + 100, H * 0.81, 22);

    // Site link
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "400 24px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(SITE_URL, textX, H - 38);

    // Profile photo — right edge
    const photoR = 90;
    const photoX = W - photoR - 55;
    const photoY = H / 2;
    await drawProfileCircle(ctx, avatarImg, initials, photoX, photoY, photoR, 6);
  }

  return canvas.toDataURL("image/png");
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export default function WellCupShareCard({ winner, period, periodLabel, onClose }: Props) {
  const [generating, setGenerating] = useState<"instagram" | "facebook" | null>(null);

  const handleDownload = async (size: "instagram" | "facebook") => {
    setGenerating(size);
    try {
      const dataUrl = await generateCard(winner, period, periodLabel, size);
      const label = size === "instagram" ? "instagram-story" : "facebook";
      downloadDataUrl(dataUrl, `well-cup-${label}-${winner.name.replace(/\s+/g, "-").toLowerCase()}.png`);
    } catch (err) {
      console.error("Share card generation failed:", err);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-surface rounded-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-text">Share your win 🏆</h2>
            <p className="text-xs text-text-muted mt-0.5">{winner.name} · {periodLabel}</p>
          </div>
          <button onClick={onClose} aria-label="Close">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        {/* Card preview */}
        <div
          className="w-full rounded-card overflow-hidden mb-4"
          style={{
            aspectRatio: "1200/630",
            background: "linear-gradient(135deg, #2a4a7f 0%, #1e6fa8 55%, #6ab8d8 100%)",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            padding: "16px 20px",
            gap: "14px",
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0, width: "90px" }}>
            <img
              src={WELL_LOGO_URL}
              alt="WELL"
              style={{ height: "18px", objectFit: "contain" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span style={{ fontSize: "22px" }}>🏆</span>
            <span style={{ fontSize: "9px", fontWeight: 500, color: "rgba(255,255,255,0.9)", letterSpacing: "0.06em", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "20px", padding: "2px 8px", whiteSpace: "nowrap" }}>CHAMPION</span>
          </div>
          <div style={{ width: "1px", alignSelf: "stretch", margin: "8px 0", background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.6)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>{periodLabel}</span>
            <span style={{ fontSize: "15px", fontWeight: 500, color: "white" }}>{winner.name}</span>
            <span style={{ fontSize: "18px", fontWeight: 500, color: "white" }}>{winner.total_points.toLocaleString()} <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>pts</span></span>
            <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>{SITE_URL}</span>
          </div>
          {winner.avatar ? (
            <img
              src={winner.avatar}
              alt={winner.name}
              style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.85)", flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#3a8fc4", border: "2px solid rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "16px", fontWeight: 500, color: "white" }}>
              {winner.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleDownload("instagram")}
            disabled={!!generating}
            className="flex items-center justify-center gap-2 w-full py-3 gradient-brand text-white text-sm font-semibold rounded-card disabled:opacity-50"
          >
            <Download size={15} />
            {generating === "instagram" ? "Generating…" : "Download for Instagram Story (9:16)"}
          </button>
          <button
            onClick={() => handleDownload("facebook")}
            disabled={!!generating}
            className="flex items-center justify-center gap-2 w-full py-3 bg-surface-2 border border-border text-sm font-semibold text-text rounded-card disabled:opacity-50"
          >
            <Download size={15} />
            {generating === "facebook" ? "Generating…" : "Download for Facebook (1200×630)"}
          </button>
        </div>
      </div>
    </div>
  );
}
