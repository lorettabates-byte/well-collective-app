import { Capacitor } from "@capacitor/core";
import { Download, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import wellLogoAsset from "../assets/well-logo-white.png";

const WELL_LOGO_URL = "https://lorettabates.com/wp-content/uploads/2025/11/WELL-Logo-white.png";
const SITE_URL = "www.lorettabates.com";

export interface ShareWinner {
  name: string;
  avatar: string | null;
  total_points: number;
  stat?: string;
}

export type SharePeriod = "daily" | "monthly" | "yearly" | "spotlight" | "comeback";

interface Props {
  winner: ShareWinner;
  period: SharePeriod;
  periodLabel: string;
  onClose: () => void;
  isOwnWin?: boolean;
}

// Visual identity per card type
const THEMES = {
  daily: {
    gradStops: ["#2a4a7f", "#1e6fa8", "#6ab8d8"],
    gradDir: (W: number, H: number) => [0, 0, W, H] as [number, number, number, number],
    emoji: "🏆",
    pillLabel: "DAILY WINNER",
    pillBg: "rgba(255,255,255,0.15)",
    pillBorder: "rgba(255,255,255,0.35)",
    accentHex: "#6ab8d8",
    accentRgba: "rgba(106,184,216,0.6)",
    previewBg: "linear-gradient(135deg, #2a4a7f 0%, #1e6fa8 55%, #6ab8d8 100%)",
    previewBadge: { bg: "rgba(255,255,255,0.15)", border: "rgba(255,255,255,0.35)", color: "rgba(255,255,255,0.95)" },
  },
  monthly: {
    gradStops: ["#2d0f5e", "#6b21d8", "#c084fc"],
    gradDir: (W: number, H: number) => [0, H, W, 0] as [number, number, number, number],
    emoji: "👑",
    pillLabel: "MONTHLY CHAMPION",
    pillBg: "rgba(192,132,252,0.2)",
    pillBorder: "rgba(192,132,252,0.55)",
    accentHex: "#e9d5ff",
    accentRgba: "rgba(192,132,252,0.7)",
    previewBg: "linear-gradient(135deg, #2d0f5e 0%, #6b21d8 55%, #c084fc 100%)",
    previewBadge: { bg: "rgba(192,132,252,0.2)", border: "rgba(192,132,252,0.5)", color: "#e9d5ff" },
  },
  yearly: {
    gradStops: ["#08080f", "#0f1832", "#b45309"],
    gradDir: (W: number, H: number) => [W, 0, 0, H] as [number, number, number, number],
    emoji: "⭐",
    pillLabel: "YEARLY CHAMPION",
    pillBg: "rgba(180,83,9,0.25)",
    pillBorder: "rgba(251,191,36,0.55)",
    accentHex: "#fbbf24",
    accentRgba: "rgba(251,191,36,0.7)",
    previewBg: "linear-gradient(155deg, #08080f 0%, #0f1832 45%, #b45309 100%)",
    previewBadge: { bg: "rgba(180,83,9,0.25)", border: "rgba(251,191,36,0.5)", color: "#fbbf24" },
  },
  spotlight: {
    gradStops: ["#0d2b2b", "#0f6b57", "#34d399"],
    gradDir: (W: number, H: number) => [0, 0, W, H] as [number, number, number, number],
    emoji: "✨",
    pillLabel: "COMMUNITY SPOTLIGHT",
    pillBg: "rgba(52,211,153,0.15)",
    pillBorder: "rgba(52,211,153,0.45)",
    accentHex: "#34d399",
    accentRgba: "rgba(52,211,153,0.65)",
    previewBg: "linear-gradient(135deg, #0d2b2b 0%, #0f6b57 55%, #34d399 100%)",
    previewBadge: { bg: "rgba(52,211,153,0.15)", border: "rgba(52,211,153,0.45)", color: "#34d399" },
  },
  comeback: {
    gradStops: ["#431407", "#9a3412", "#fb923c"],
    gradDir: (W: number, H: number) => [0, H, W, 0] as [number, number, number, number],
    emoji: "🔥",
    pillLabel: "COMEBACK STORY",
    pillBg: "rgba(251,146,60,0.18)",
    pillBorder: "rgba(251,146,60,0.5)",
    accentHex: "#fb923c",
    accentRgba: "rgba(251,146,60,0.65)",
    previewBg: "linear-gradient(135deg, #431407 0%, #9a3412 55%, #fb923c 100%)",
    previewBadge: { bg: "rgba(251,146,60,0.18)", border: "rgba(251,146,60,0.5)", color: "#fb923c" },
  },
} as const;

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
  weight = "500"
): number {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px system-ui, -apple-system, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  }
  return minSize;
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
  cx: number, cy: number,
  fontSize: number,
  bgColor = "rgba(255,255,255,0.15)",
  borderColor = "rgba(255,255,255,0.35)",
  textColor = "rgba(255,255,255,0.95)"
) {
  ctx.font = `500 ${fontSize}px system-ui, -apple-system, sans-serif`;
  const tw = ctx.measureText(text).width;
  const ph = fontSize * 1.7;
  const pw = tw + fontSize * 1.6;
  drawRoundedRect(ctx, cx - pw / 2, cy - ph / 2, pw, ph, ph / 2);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy);
}

async function drawProfileCircle(
  ctx: CanvasRenderingContext2D,
  avatarImg: HTMLImageElement | null,
  initials: string,
  cx: number, cy: number, r: number, borderW: number,
  borderColor = "rgba(255,255,255,0.9)"
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
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = borderW;
  ctx.stroke();
}

function drawDecorations(
  ctx: CanvasRenderingContext2D,
  period: SharePeriod,
  W: number, H: number,
  isIG: boolean,
  _theme: typeof THEMES[SharePeriod]
) {
  const ring = (cx: number, cy: number, r: number, color: string, lw = 2) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.stroke();
  };

  if (period === "daily") {
    // Two subtle white rings — clean, simple
    ring(W * 0.88, isIG ? H * 0.06 : -90, isIG ? 260 : 240, "rgba(255,255,255,0.09)");
    ring(W * 0.12, isIG ? H * 0.94 : H + 70, isIG ? 200 : 180, "rgba(255,255,255,0.07)");

  } else if (period === "monthly") {
    // Three overlapping purple rings, top-right cluster
    ring(W * 0.85, isIG ? H * 0.07 : -40, isIG ? 280 : 200, "rgba(192,132,252,0.12)");
    ring(W * 0.75, isIG ? H * 0.10 : -20, isIG ? 200 : 150, "rgba(192,132,252,0.09)");
    ring(W * 0.95, isIG ? H * 0.03 : -60, isIG ? 340 : 260, "rgba(192,132,252,0.07)");
    // Small accent ring bottom-left
    ring(W * 0.08, isIG ? H * 0.96 : H + 50, isIG ? 160 : 120, "rgba(192,132,252,0.08)");

  } else if (period === "yearly") {
    // Starburst radiating from top-right — premium, distinctive
    const bx = W * 0.9;
    const by = isIG ? H * 0.1 : H * 0.25;
    const maxR = isIG ? 480 : 280;
    const rays = 16;
    for (let i = 0; i < rays; i++) {
      const angle = (i / rays) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(angle) * maxR, by + Math.sin(angle) * maxR);
      ctx.strokeStyle = "rgba(180,83,9,0.11)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // Gold ring overlay
    ring(bx, by, isIG ? 120 : 70, "rgba(251,191,36,0.12)", 3);
    ring(bx, by, isIG ? 240 : 140, "rgba(251,191,36,0.07)", 2);
    // Small ring bottom-left
    ring(W * 0.06, isIG ? H * 0.93 : H + 40, isIG ? 180 : 130, "rgba(251,191,36,0.08)");

  } else if (period === "spotlight") {
    // Organic concentric rings bottom-right — community/warmth feel
    ring(W * 0.9, isIG ? H * 0.88 : H + 60, isIG ? 320 : 220, "rgba(52,211,153,0.1)");
    ring(W * 0.9, isIG ? H * 0.88 : H + 60, isIG ? 200 : 140, "rgba(52,211,153,0.12)");
    ring(W * 0.9, isIG ? H * 0.88 : H + 60, isIG ? 100 : 70, "rgba(52,211,153,0.08)");
    // Top-left soft ring
    ring(W * 0.05, isIG ? H * 0.05 : -50, isIG ? 220 : 160, "rgba(52,211,153,0.08)");

  } else if (period === "comeback") {
    // Starburst from bottom-left — rising from the ashes feel
    const bx = W * 0.08;
    const by = isIG ? H * 0.9 : H * 0.8;
    const maxR = isIG ? 420 : 240;
    const rays = 12;
    for (let i = 0; i < rays; i++) {
      const angle = (i / rays) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(angle) * maxR, by + Math.sin(angle) * maxR);
      ctx.strokeStyle = "rgba(251,146,60,0.10)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ring(bx, by, isIG ? 110 : 65, "rgba(251,146,60,0.12)", 3);
    ring(bx, by, isIG ? 220 : 130, "rgba(251,146,60,0.07)", 2);
    // Accent ring top-right
    ring(W * 0.92, isIG ? H * 0.08 : -50, isIG ? 240 : 160, "rgba(251,146,60,0.08)");
  }
}

async function generateCard(
  winner: ShareWinner,
  period: SharePeriod,
  periodLabel: string,
  size: "instagram" | "facebook",
  logoDataUrl: string | null
): Promise<string> {
  const isIG = size === "instagram";
  const W = isIG ? 1080 : 1200;
  const H = isIG ? 1920 : 630;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const theme = THEMES[period];
  const [x1, y1, x2, y2] = theme.gradDir(W, H);

  // Background gradient
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, theme.gradStops[0]);
  grad.addColorStop(0.55, theme.gradStops[1]);
  grad.addColorStop(1, theme.gradStops[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Per-period decorations
  drawDecorations(ctx, period, W, H, isIG, theme);

  // Cache-bust the avatar to avoid CORS taint from a non-CORS cached response
  // (the preview <img> loads without crossOrigin, caching the resource; adding ?cb= forces a fresh CORS fetch)
  const avatarCacheBusted = winner.avatar
    ? `${winner.avatar}${winner.avatar.includes("?") ? "&" : "?"}cb=${Date.now()}`
    : null;

  const [logoImg, avatarImg] = await Promise.all([
    logoDataUrl ? loadImage(logoDataUrl).catch(() => null) : Promise.resolve(null),
    avatarCacheBusted ? loadImage(avatarCacheBusted).catch(() => null) : Promise.resolve(null),
  ]);

  const initials = winner.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const now = new Date();
  const monthYear = now.toLocaleString("default", { month: "long", year: "numeric" });
  const pointsLine = winner.stat ?? winner.total_points.toLocaleString();
  const pointsSuffix = winner.stat ? "" : " pts";

  if (isIG) {
    // ── Instagram Story (1080 × 1920) ──

    if (logoImg) {
      const lh = 360;
      const lw = (logoImg.width / logoImg.height) * lh;
      ctx.drawImage(logoImg, (W - lw) / 2, 110, lw, lh);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "500 54px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("WELL COLLECTIVE", W / 2, 165);
    }

    // Hero emoji
    ctx.font = "210px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(theme.emoji, W / 2, H * 0.345);

    // Profile circle with period-tinted border
    await drawProfileCircle(ctx, avatarImg, initials, W / 2, H * 0.5, 130, 9, theme.accentHex);

    // Period label — accent colored
    ctx.fillStyle = theme.accentRgba;
    ctx.font = "500 46px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(periodLabel.toUpperCase(), W / 2, H * 0.615);

    // Winner name — auto-scale so long names don't overflow
    const nameMaxWidthIG = W - 80;
    const nameFontSizeIG = fitFontSize(ctx, winner.name, nameMaxWidthIG, 92, 48);
    ctx.fillStyle = "#ffffff";
    ctx.font = `500 ${nameFontSizeIG}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(winner.name, W / 2, H * 0.675);

    // Points / stat line — accent for yearly/spotlight, auto-scale to fit
    const isAccentPoints = period === "yearly" || period === "spotlight";
    ctx.fillStyle = isAccentPoints ? theme.accentHex : "#ffffff";
    const pointsFontSizeIG = fitFontSize(ctx, pointsLine, W - 80, 124, 48, "700");
    ctx.font = `700 ${pointsFontSizeIG}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(pointsLine, W / 2, H * 0.754);
    if (pointsSuffix) {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "400 50px system-ui, sans-serif";
      ctx.fillText("points", W / 2, H * 0.796);
    }

    // Champion / spotlight pill
    drawPillLabel(ctx, theme.pillLabel, W / 2, H * 0.845, 38,
      theme.pillBg, theme.pillBorder, theme.accentHex === "#e9d5ff" || theme.accentHex === "#6ab8d8" ? "rgba(255,255,255,0.95)" : theme.accentHex);

    // Date + site
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "400 40px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(monthYear, W / 2, H * 0.907);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "400 38px system-ui, sans-serif";
    ctx.fillText(SITE_URL, W / 2, H * 0.952);

  } else {
    // ── Facebook landscape (1200 × 630) ──
    const leftW = 290;

    if (logoImg) {
      const lw = leftW - 24;
      const lh = (logoImg.height / logoImg.width) * lw;
      ctx.drawImage(logoImg, (leftW - lw) / 2, 32, lw, lh);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "500 28px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("WELL COLLECTIVE", leftW / 2, 92);
    }

    // Period emoji (left column)
    ctx.font = "88px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(theme.emoji, leftW / 2, H / 2 - 16);

    // Champion pill (left col)
    const shortPill = period === "daily" ? "DAILY" : period === "monthly" ? "MONTHLY" : period === "yearly" ? "YEARLY" : period === "comeback" ? "COMEBACK" : "SPOTLIGHT";
    drawPillLabel(ctx, shortPill, leftW / 2, H * 0.72, 22,
      theme.pillBg, theme.pillBorder,
      theme.accentHex === "#e9d5ff" || theme.accentHex === "#6ab8d8" ? "rgba(255,255,255,0.95)" : theme.accentHex);

    // Vertical divider
    ctx.beginPath();
    ctx.moveTo(leftW, 55);
    ctx.lineTo(leftW, H - 55);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const textX = leftW + 44;

    // Period label row — accent colored
    ctx.fillStyle = theme.accentRgba;
    ctx.font = "500 24px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${periodLabel.toUpperCase()} · ${monthYear.toUpperCase()}`, textX, H * 0.28);

    // Profile photo radius — declared early because nameMaxWidthFB depends on it
    const photoR = 90;

    // Winner name — auto-scale to avoid overflowing into the avatar
    const nameMaxWidthFB = W - textX - photoR * 2 - 80;
    const nameFontSizeFB = fitFontSize(ctx, winner.name, nameMaxWidthFB, 72, 36);
    ctx.fillStyle = "#ffffff";
    ctx.font = `500 ${nameFontSizeFB}px system-ui, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(winner.name, textX, H * 0.46);

    // Points row — auto-scale so long stat text (e.g. Spotlight phrase) doesn't overflow
    const isAccentPoints = period === "yearly" || period === "spotlight";
    ctx.fillStyle = isAccentPoints ? theme.accentHex : "#ffffff";
    const pointsMaxWidthFB = W - textX - photoR * 2 - 80;
    const pointsFontSizeFB = fitFontSize(ctx, pointsLine, pointsMaxWidthFB, 82, 28, "700");
    ctx.font = `700 ${pointsFontSizeFB}px system-ui, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(pointsLine, textX, H * 0.645);
    if (pointsSuffix) {
      const ptsW = ctx.measureText(pointsLine).width;
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "400 30px system-ui, sans-serif";
      ctx.fillText("points", textX + ptsW + 12, H * 0.645 - 6);
    }

    // Pill (right section)
    drawPillLabel(ctx, theme.pillLabel, textX + 110, H * 0.81, 22,
      theme.pillBg, theme.pillBorder,
      theme.accentHex === "#e9d5ff" || theme.accentHex === "#6ab8d8" ? "rgba(255,255,255,0.95)" : theme.accentHex);

    // Site link
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "400 24px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(SITE_URL, textX, H - 38);

    // Profile photo — right edge with accent border
    const photoX = W - photoR - 55;
    const photoY = H / 2;
    await drawProfileCircle(ctx, avatarImg, initials, photoX, photoY, photoR, 6, theme.accentHex);
  }

  try {
    return canvas.toDataURL("image/png");
  } catch {
    // Canvas tainted (avatar CORS issue) — redraw without avatar and retry
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    drawDecorations(ctx, period, W, H, isIG, theme);
    if (isIG) {
      if (logoImg) {
        const lh = 360;
        const lw = (logoImg.width / logoImg.height) * lh;
        ctx.drawImage(logoImg, (W - lw) / 2, 110, lw, lh);
      }
      await drawProfileCircle(ctx, null, initials, W / 2, H * 0.5, 130, 9, theme.accentHex);
    } else {
      if (logoImg) {
        const leftW = 290;
        const lw = leftW - 24;
        const lh = (logoImg.height / logoImg.width) * lw;
        ctx.drawImage(logoImg, (leftW - lw) / 2, 32, lw, lh);
      }
      await drawProfileCircle(ctx, null, initials, W - 90 - 55, H / 2, 90, 6, theme.accentHex);
    }
    return canvas.toDataURL("image/png");
  }
}

async function saveOrDownload(dataUrl: string, filename: string): Promise<void> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "WELL Collective" });
      return;
    }
  } catch {
    // fall through to link download
  }
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export default function WellCupShareCard({ winner, period, periodLabel, onClose, isOwnWin = false }: Props) {
  const [generating, setGenerating] = useState<"instagram" | "facebook" | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [nativePreview, setNativePreview] = useState<{ dataUrl: string; size: "instagram" | "facebook" } | null>(null);
  const [nativeFileUrl, setNativeFileUrl] = useState<string | null>(null);
  const [nativeShareError, setNativeShareError] = useState<string | null>(null);
  const theme = THEMES[period];
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 20); return () => clearTimeout(t); }, []);

  const handleDownload = async (size: "instagram" | "facebook") => {
    setGenerating(size);
    setGenerateError(null);
    setNativeFileUrl(null);
    setNativeShareError(null);
    try {
      const dataUrl = await generateCard(winner, period, periodLabel, size, wellLogoAsset);
      if (Capacitor.isNativePlatform()) {
        setNativePreview({ dataUrl, size });
      } else {
        const label = size === "instagram" ? "instagram-story" : "facebook";
        await saveOrDownload(dataUrl, `well-cup-${period}-${label}-${winner.name.replace(/\s+/g, "-").toLowerCase()}.png`);
      }
    } catch (err) {
      console.error("Share card generation failed:", err);
      setGenerateError("Could not generate card — please try again.");
    } finally {
      setGenerating(null);
    }
  };

  const badgeStyle = theme.previewBadge;

  if (nativePreview) {
    const filename = `well-cup-${period}-${nativePreview.size === "instagram" ? "instagram-story" : "facebook"}-${winner.name.replace(/\s+/g, "-").toLowerCase()}.png`;

    const handleNativeShare = async () => {
      setNativeShareError(null);
      try {
        const blob = await (await fetch(nativePreview.dataUrl)).blob();
        const file = new File([blob], filename, { type: "image/png" });

        // Call navigator.share directly — skip canShare guard which is unreliable in WKWebView
        if (typeof navigator.share === "function") {
          await navigator.share({ files: [file], title: "WELL Collective" });
          return;
        }

        // navigator.share not available — write to cache and show as real file URL
        // so iOS long-press context menu can save it
        const { Filesystem, Directory } = await import("@capacitor/filesystem");
        const base64 = nativePreview.dataUrl.split(",")[1];
        const result = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
        setNativeFileUrl(Capacitor.convertFileSrc(result.uri));

      } catch (err: unknown) {
        const name = (err as { name?: string })?.name;
        if (name === "AbortError") return; // user cancelled share sheet — fine
        console.error("Share error:", err);
        setNativeShareError("Sharing is not available on this device. Screenshot the image to save it.");
      }
    };

    return createPortal(
      <div
        style={{ position: "fixed", inset: 0, zIndex: 10001, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 24 }}
        onClick={() => setNativePreview(null)}
      >
        <button onClick={() => setNativePreview(null)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: 8 }}>
          <X size={20} />
        </button>
        <img
          src={nativeFileUrl ?? nativePreview.dataUrl}
          alt="Award card"
          style={{ maxWidth: "100%", maxHeight: "60vh", objectFit: "contain", borderRadius: 12 }}
          onClick={(e) => e.stopPropagation()}
        />
        {nativeShareError ? (
          <p style={{ color: "#f87171", fontSize: 13, textAlign: "center", padding: "0 16px" }}>{nativeShareError}</p>
        ) : nativeFileUrl ? (
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, textAlign: "center" }}>
            Press and hold the image above, then choose{" "}
            <strong style={{ color: "white" }}>{Capacitor.getPlatform() === "android" ? "Download image" : "Save to Photos"}</strong>
          </p>
        ) : (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handleNativeShare(); }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "linear-gradient(135deg, #01519D, #0191CE)",
                color: "white", border: "none", borderRadius: 12,
                padding: "14px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}
            >
              <Share2 size={16} />
              {Capacitor.getPlatform() === "android" ? "Share / Save Image" : "Share / Save to Photos"}
            </button>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center" }}>
              Tap the button above, then choose Save Image
            </p>
          </>
        )}
      </div>,
      document.body
    );
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.6)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.25s ease",
        }}
      />
      {/* Bottom sheet */}
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10000,
          minHeight: "72vh", maxHeight: "92vh",
          display: "flex", flexDirection: "column",
          background: "var(--color-surface, #0e1a26)",
          borderRadius: "20px 20px 0 0",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px 8px", position: "relative", flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "0 auto 10px" }} />
            <h2 className="text-sm font-bold text-text">
              {isOwnWin ? "Share your win 🏆" : `Share ${winner.name.split(" ")[0]}'s win 🏆`}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">{winner.name} · {periodLabel}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-text-muted ml-4">
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-8">

        {/* Card preview */}
        <div
          className="w-full rounded-card overflow-hidden mb-4"
          style={{
            aspectRatio: "1200/630",
            background: theme.previewBg,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            padding: "16px 20px",
            gap: "14px",
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0, width: "120px" }}>
            <img
              src={WELL_LOGO_URL}
              alt="WELL"
              style={{ width: "108px", height: "auto", objectFit: "contain" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span style={{ fontSize: "22px" }}>{theme.emoji}</span>
            <span style={{
              fontSize: "9px", fontWeight: 600, letterSpacing: "0.06em",
              background: badgeStyle.bg, border: `1px solid ${badgeStyle.border}`,
              color: badgeStyle.color,
              borderRadius: "20px", padding: "2px 8px", whiteSpace: "nowrap",
            }}>
              {period === "daily" ? "DAILY" : period === "monthly" ? "MONTHLY" : period === "yearly" ? "YEARLY" : "SPOTLIGHT"}
            </span>
          </div>
          <div style={{ width: "1px", alignSelf: "stretch", margin: "8px 0", background: "rgba(255,255,255,0.12)", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "9px", color: theme.accentRgba, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{periodLabel}</span>
            <span style={{ fontSize: "15px", fontWeight: 500, color: "white" }}>{winner.name}</span>
            <span style={{ fontSize: "18px", fontWeight: 700, color: (period === "yearly" || period === "spotlight") ? theme.accentHex : "white" }}>
              {winner.stat ?? winner.total_points.toLocaleString()}
              {!winner.stat && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}> pts</span>}
            </span>
            <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>{SITE_URL}</span>
          </div>
          {winner.avatar ? (
            <img
              src={winner.avatar}
              alt={winner.name}
              style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${theme.accentHex}`, flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#3a8fc4", border: `2px solid ${theme.accentHex}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "16px", fontWeight: 500, color: "white" }}>
              {winner.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {generateError && (
          <p className="text-xs text-red-400 text-center px-2">{generateError}</p>
        )}

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
    </>,
    document.body
  );
}
