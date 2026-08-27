import { useEffect, useRef, useState } from "react";
import { ChevronUp, Pencil } from "lucide-react";

const GOAL_KEY = "well-cup-personal-goal";
const GOAL_PRESETS = [100, 200, 300, 500];

interface Props { dailyPts: number; goalPts?: number }

const STAGES = [
  "Bare earth — your journey begins",
  "First little blooms peek through",
  "Shoots reaching for the light",
  "Buds opening across the garden",
  "Your garden is filling in",
  "A full, living garden",
  "Full bloom — a crown of light",
];

export default function WellGarden({ dailyPts, goalPts }: Props) {
  const [personalGoal, setPersonalGoal] = useState<number>(() => {
    const saved = localStorage.getItem(GOAL_KEY);
    return saved ? parseInt(saved, 10) : (goalPts ?? 200);
  });
  const [editingGoal, setEditingGoal] = useState(false);
  const effectiveGoal = personalGoal;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const ptsRef = useRef(dailyPts);

  useEffect(() => { ptsRef.current = dailyPts; }, [dailyPts]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const W = cv.width, H = cv.height;
    const GY = H * 0.65;

    const bflies = [
      { x: 80, y: GY - 60, vx: 0.55, vy: -0.15, ph: 0, col: "#f472b6", s: 6.5 },
      { x: 230, y: GY - 90, vx: -0.5, vy: 0.12, ph: 1.3, col: "#84d8fd", s: 5.5 },
    ];
    const mists = Array.from({ length: 18 }, (_, i) => ({
      x: W * (i / 18) + Math.random() * 15 - 7,
      y: GY + 2 + Math.random() * 20,
      r: 28 + Math.random() * 30,
      vx: (Math.random() - 0.5) * 0.28,
      base: GY + 2 + Math.random() * 20,
    }));

    const cl = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
    const ez = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const lp = (a: number, b: number, t: number) => a + (b - a) * t;

    function drawLeaf(x: number, y: number, ang: number, sz: number, col: string) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.fillStyle = col; ctx.beginPath();
      ctx.moveTo(0, 0); ctx.bezierCurveTo(sz * 0.3, -sz * 0.55, sz * 1.1, -sz * 0.28, sz * 1.4, 0);
      ctx.bezierCurveTo(sz * 1.1, sz * 0.28, sz * 0.3, sz * 0.55, 0, 0);
      ctx.fill(); ctx.restore();
    }
    function drawDaisy(x: number, y: number, r: number, np: number, pc: string, cc: string) {
      for (let i = 0; i < np; i++) {
        const a = (i / np) * Math.PI * 2;
        ctx.fillStyle = pc; ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.42, r * 0.2, a, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = cc; ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, Math.PI * 2); ctx.fill();
    }
    function drawSpike(x: number, by: number, h: number, c1: string, c2: string, t: number) {
      const nh = h * ez(t);
      ctx.strokeStyle = c1; ctx.lineWidth = 2.2; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x, by - nh); ctx.stroke();
      const nb = Math.floor(t * 9) + 2;
      for (let i = 0; i < nb; i++) {
        const fy = by - nh * (0.25 + i * 0.07), br = 3.5 + i * 0.25, side = (i % 2 === 0) ? 1 : -1;
        ctx.fillStyle = i > nb * 0.5 ? c1 : c2;
        ctx.beginPath(); ctx.ellipse(x + side * 5 * ez(t), fy, br * ez(t) * 0.7, br * ez(t), -0.2 * side, 0, Math.PI * 2); ctx.fill();
      }
    }
    function drawTiny(x: number, y: number, r: number, pc: string, cc: string, t: number) {
      const fr = r * ez(t);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        ctx.fillStyle = pc; ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * fr * 0.58, y + Math.sin(a) * fr * 0.58, fr * 0.38, fr * 0.18, a, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = cc; ctx.beginPath(); ctx.arc(x, y, fr * 0.28, 0, Math.PI * 2); ctx.fill();
    }

    type PlantDef =
      | { x: number; s: number; h: number; t: "spike"; c1: string; c2: string }
      | { x: number; s: number; h: number; t: "tall-daisy" | "daisy"; sc: string; lc: string; fc: string; cc: string; p: number; bs?: number }
      | { x: number; s: number; h: number; t: "tiny"; fc: string; cc: string };

    const PLANTS: PlantDef[] = [
      { x: 0.07, s: 0.04, h: 115, t: "spike", c1: "#7c3aed", c2: "#a855f7" },
      { x: 0.93, s: 0.05, h: 108, t: "spike", c1: "#0d9488", c2: "#2dd4a0" },
      { x: 0.32, s: 0.06, h: 112, t: "spike", c1: "#db2777", c2: "#f472b6" },
      { x: 0.68, s: 0.05, h: 110, t: "spike", c1: "#4338ca", c2: "#818cf8" },
      { x: 0.18, s: 0.08, h: 105, t: "tall-daisy", sc: "#1d7a45", lc: "rgba(25,100,55,0.85)", fc: "#3b9eff", cc: "#1565c0", p: 7, bs: 0.55 },
      { x: 0.5,  s: 0.06, h: 118, t: "tall-daisy", sc: "#2dd4a0", lc: "rgba(35,170,105,0.85)", fc: "#fbbf24", cc: "#d97706", p: 7, bs: 0.5 },
      { x: 0.78, s: 0.07, h: 110, t: "tall-daisy", sc: "#1d7a45", lc: "rgba(25,110,60,0.85)", fc: "#f9a8d4", cc: "#be185d", p: 8, bs: 0.52 },
      { x: 0.12, s: 0.2,  h: 75,  t: "daisy", sc: "#2dd4a0", lc: "rgba(30,150,90,0.8)", fc: "#f97316", cc: "#c2410c", p: 8, bs: 0.45 },
      { x: 0.28, s: 0.18, h: 70,  t: "daisy", sc: "#1d7a45", lc: "rgba(25,100,55,0.8)", fc: "#a78bfa", cc: "#6d28d9", p: 7, bs: 0.42 },
      { x: 0.43, s: 0.22, h: 78,  t: "daisy", sc: "#2dd4a0", lc: "rgba(35,160,100,0.8)", fc: "#34d399", cc: "#059669", p: 8, bs: 0.48 },
      { x: 0.58, s: 0.19, h: 72,  t: "daisy", sc: "#1d7a45", lc: "rgba(25,110,60,0.8)", fc: "#fb923c", cc: "#ea580c", p: 7, bs: 0.44 },
      { x: 0.73, s: 0.21, h: 76,  t: "daisy", sc: "#2dd4a0", lc: "rgba(35,165,100,0.75)", fc: "#60a5fa", cc: "#2563eb", p: 8, bs: 0.46 },
      { x: 0.88, s: 0.17, h: 68,  t: "daisy", sc: "#1d7a45", lc: "rgba(20,95,50,0.8)", fc: "#f472b6", cc: "#db2777", p: 7, bs: 0.43 },
      { x: 0.05, s: 0.28, h: 52,  t: "daisy", sc: "#2dd4a0", lc: "rgba(30,150,90,0.75)", fc: "#fde68a", cc: "#b45309", p: 8, bs: 0.38 },
      { x: 0.22, s: 0.3,  h: 48,  t: "daisy", sc: "#1d7a45", lc: "rgba(25,100,55,0.75)", fc: "#c4b5fd", cc: "#7c3aed", p: 7, bs: 0.36 },
      { x: 0.38, s: 0.26, h: 54,  t: "daisy", sc: "#2dd4a0", lc: "rgba(35,155,95,0.75)", fc: "#6ee7b7", cc: "#059669", p: 8, bs: 0.35 },
      { x: 0.55, s: 0.31, h: 50,  t: "daisy", sc: "#1d7a45", lc: "rgba(20,90,48,0.75)", fc: "#fca5a5", cc: "#dc2626", p: 7, bs: 0.37 },
      { x: 0.70, s: 0.29, h: 54,  t: "daisy", sc: "#2dd4a0", lc: "rgba(35,160,100,0.75)", fc: "#93c5fd", cc: "#1d4ed8", p: 8, bs: 0.36 },
      { x: 0.85, s: 0.32, h: 46,  t: "daisy", sc: "#1d7a45", lc: "rgba(25,100,55,0.75)", fc: "#fdba74", cc: "#ea580c", p: 7, bs: 0.38 },
      { x: 0.02, s: 0.02, h: 28, t: "tiny", fc: "#f9a8d4", cc: "#be185d" },
      { x: 0.10, s: 0.04, h: 26, t: "tiny", fc: "#fbbf24", cc: "#b45309" },
      { x: 0.19, s: 0.03, h: 30, t: "tiny", fc: "#34d399", cc: "#065f46" },
      { x: 0.28, s: 0.05, h: 24, t: "tiny", fc: "#60a5fa", cc: "#1e40af" },
      { x: 0.37, s: 0.02, h: 28, t: "tiny", fc: "#f472b6", cc: "#9d174d" },
      { x: 0.46, s: 0.04, h: 26, t: "tiny", fc: "#fde68a", cc: "#92400e" },
      { x: 0.55, s: 0.03, h: 30, t: "tiny", fc: "#a5f3fc", cc: "#0e7490" },
      { x: 0.63, s: 0.05, h: 24, t: "tiny", fc: "#c4b5fd", cc: "#5b21b6" },
      { x: 0.72, s: 0.02, h: 28, t: "tiny", fc: "#86efac", cc: "#166534" },
      { x: 0.81, s: 0.04, h: 26, t: "tiny", fc: "#fca5a5", cc: "#991b1b" },
      { x: 0.90, s: 0.03, h: 30, t: "tiny", fc: "#fde68a", cc: "#92400e" },
      { x: 0.97, s: 0.05, h: 24, t: "tiny", fc: "#f9a8d4", cc: "#be185d" },
    ];

    function drawPlants(pct: number, t: number) {
      PLANTS.forEach(p => {
        if (pct <= p.s) return;
        const raw = cl((pct - p.s) / 0.28, 0, 1);
        const bx = W * p.x, by = GY + 2;
        const sway = Math.sin(t * 0.55 + p.x * 7) * 1.8 * ez(raw);

        if (p.t === "spike") {
          drawSpike(bx, by, p.h, p.c1, p.c2, raw); return;
        }
        if (p.t === "tiny") {
          const sh = p.h * ez(raw);
          if (raw < 0.08) return;
          ctx.strokeStyle = "#1d7a45"; ctx.lineWidth = 1.4; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + sway * 0.4, by - sh * 0.5, bx + sway * 0.5, by - sh); ctx.stroke();
          const bt = cl((raw - 0.05) / 0.25, 0, 1);
          drawTiny(bx + sway * 0.5, by - sh, 8, p.fc, p.cc, bt); return;
        }
        const stemH = p.h * ez(raw);
        const tx = bx + sway, ty = by - stemH;
        ctx.globalAlpha = 0.1; ctx.strokeStyle = "#000"; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + sway * 0.4 + 4, by - stemH * 0.5, tx + 4, ty + 4); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = p.sc; ctx.lineWidth = 1.8 + ez(raw); ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + sway * 0.4, by - stemH * 0.5, tx, ty); ctx.stroke();
        if (raw > 0.2) {
          const lt = cl((raw - 0.2) / 0.35, 0, 1);
          const lmx = bx + sway * 0.3, lmy = by - stemH * 0.4;
          drawLeaf(lmx, lmy, -0.7, 13 * lt, p.lc);
          if (raw > 0.38) drawLeaf(lmx + 5, lmy + 8, 0.45, 10 * cl((raw - 0.38) / 0.35, 0, 1), p.lc);
          if (raw > 0.55 && stemH > 50) drawLeaf(tx - 3, ty + stemH * 0.25, -0.5, 8 * cl((raw - 0.55) / 0.3, 0, 1), p.lc);
        }
        const bst = ("bs" in p && p.bs) ? p.bs : 0.55;
        if (raw > bst) {
          const ft = cl((raw - bst) / (1 - bst), 0, 1);
          const fr = (p.t === "tall-daisy" ? 13 : 10) * ft;
          drawDaisy(tx, ty, fr, p.p, p.fc, p.cc);
        }
      });
    }

    function drawButterfly(bf: typeof bflies[0], pct: number, t: number) {
      if (pct < 0.42) return;
      const bt = cl((pct - 0.42) / 0.25, 0, 1);
      bf.x += bf.vx + Math.sin(t * 1.1 + bf.ph) * 0.4;
      bf.y += bf.vy + Math.sin(t * 2.2 + bf.ph) * 0.35;
      if (bf.x < -10) bf.x = W + 10; if (bf.x > W + 10) bf.x = -10;
      bf.y = cl(bf.y, GY - H * 0.58, GY - 15);
      const s = bf.s * bt, flap = Math.abs(Math.sin(t * 3.8 + bf.ph));
      ctx.fillStyle = bf.col; ctx.globalAlpha = 0.82 * bt;
      ctx.beginPath(); ctx.ellipse(bf.x - s * flap, bf.y - s * 0.3, s * flap, s * 0.55, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(bf.x + s * flap, bf.y - s * 0.3, s * flap, s * 0.55, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = bf.col + "bb";
      ctx.beginPath(); ctx.ellipse(bf.x - s * flap * 0.65, bf.y + s * 0.2, s * flap * 0.55, s * 0.38, 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(bf.x + s * flap * 0.65, bf.y + s * 0.2, s * flap * 0.55, s * 0.38, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    function drawCrown(pct: number, t: number) {
      if (pct < 1) return;
      const pulse = 0.92 + 0.08 * Math.sin(t * 2.2);
      const cx = W / 2, cy = 16;
      [75, 50, 30].forEach((r, i) => {
        const a = [0.06, 0.13, 0.22][i] * pulse;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(251,191,36,${a})`); g.addColorStop(1, "rgba(251,191,36,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      });
      const cw = 25, ch = 15;
      ctx.fillStyle = `rgba(251,191,36,${0.97 * pulse})`;
      ctx.strokeStyle = `rgba(255,235,120,${0.65 * pulse})`; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - cw, cy + ch); ctx.lineTo(cx - cw, cy + 1); ctx.lineTo(cx - cw * 0.5, cy + ch * 0.38);
      ctx.lineTo(cx, cy - 3); ctx.lineTo(cx + cw * 0.5, cy + ch * 0.38); ctx.lineTo(cx + cw, cy + 1); ctx.lineTo(cx + cw, cy + ch);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      [-16, 0, 16].forEach(gx => {
        ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.beginPath(); ctx.arc(cx + gx, cy - 1, 2.2, 0, Math.PI * 2); ctx.fill();
      });
    }

    function frame() {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const pct = cl(ptsRef.current / effectiveGoal, 0, 1);
      ctx.clearRect(0, 0, W, H);

      // Sky
      const sg = ctx.createLinearGradient(0, 0, 0, GY);
      sg.addColorStop(0, `rgb(${Math.round(lp(3, 10, pct))},${Math.round(lp(8, 20, pct))},${Math.round(lp(18, 50, pct))})`);
      sg.addColorStop(1, "rgb(5,11,22)");
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, GY + 2);

      // Stars
      if (pct > 0.12) {
        const st = cl((pct - 0.12) / 0.3, 0, 1);
        [[22, 9], [50, 6], [92, 13], [135, 5], [180, 11], [218, 7], [260, 15], [300, 8], [322, 13]].forEach(([sx, sy], i) => {
          const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.75 + i));
          ctx.fillStyle = `rgba(180,220,255,${st * tw * 0.65})`;
          ctx.beginPath(); ctx.arc(sx, sy, 0.7, 0, Math.PI * 2); ctx.fill();
        });
      }
      // Moon
      if (pct > 0.08) {
        const mt = cl((pct - 0.08) / 0.28, 0, 1);
        const mx = W * 0.82, my = 24;
        [55, 38, 24, 14].forEach((r, i) => {
          const a = [0.018, 0.038, 0.07, 0.12][i] * mt;
          const mg = ctx.createRadialGradient(mx, my, 0, mx, my, r);
          mg.addColorStop(0, `rgba(180,230,255,${a})`); mg.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.fill();
        });
        ctx.fillStyle = `rgba(210,240,255,${0.88 * mt})`;
        ctx.beginPath(); ctx.arc(mx, my, 8 * mt, 0, Math.PI * 2); ctx.fill();
      }
      // Ground
      const gg = ctx.createLinearGradient(0, GY - 5, 0, H);
      gg.addColorStop(0, `rgb(${Math.round(lp(10, 28, pct))},${Math.round(lp(28, 65, pct))},${Math.round(lp(20, 38, pct))})`);
      gg.addColorStop(0.25, "#071810"); gg.addColorStop(1, "#040c08");
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.moveTo(0, GY - 3); ctx.bezierCurveTo(W * 0.22, GY + 6, W * 0.62, GY - 7, W, GY + 3);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();

      // Mist
      if (pct > 0.06) {
        const mt = cl((pct - 0.06) / 0.2, 0, 1);
        const fg = ctx.createLinearGradient(0, GY - 5, 0, GY + 40);
        fg.addColorStop(0, `rgba(1,100,180,${0.18 * mt})`); fg.addColorStop(0.4, `rgba(1,80,150,${0.12 * mt})`); fg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = fg; ctx.fillRect(0, GY - 5, W, 45);
        mists.forEach(m => {
          m.x += m.vx; if (m.x < -m.r) m.x = W + m.r; if (m.x > W + m.r) m.x = -m.r;
          m.y = m.base + Math.sin(t * 0.4 + m.x * 0.02) * 3;
          const mg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
          mg.addColorStop(0, `rgba(30,130,220,${0.2 * mt})`); mg.addColorStop(0.5, `rgba(1,100,180,${0.1 * mt})`); mg.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
        });
      }

      drawPlants(pct, t);
      if (pct > 0.42) bflies.forEach(b => drawButterfly(b, pct, t));
      drawCrown(pct, t);
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalPts]);

  const pct = Math.min(1, dailyPts / effectiveGoal);
  const stageIdx = Math.min(6, Math.floor(pct * 7));
  const goalMet = dailyPts >= effectiveGoal;

  const saveGoal = (val: number) => {
    if (val > 0) {
      setPersonalGoal(val);
      localStorage.setItem(GOAL_KEY, String(val));
    }
    setEditingGoal(false);
  };

  return (
    <div className="rounded-card bg-surface-2 border border-border overflow-hidden mt-3">
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <span className="text-[11px] font-bold text-brand-light uppercase tracking-wider">WELL Cup · Daily Garden</span>
        <span className="ml-auto text-[10px] text-text-dim">Resets daily</span>
      </div>
      <p className="px-3 pb-2 text-[11px] text-text-muted leading-relaxed">
        Your overall health and wellness is like a garden. Every good thing you do for yourself, moving your body, resting well, nourishing your mind, helps you grow and flourish. With each daily step you take, watch your garden bloom.
      </p>
      <canvas ref={canvasRef} width={332} height={200} className="w-full block" />
      <div className="px-3 pb-3 pt-2">
        {/* pts + edit button */}
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[10px] text-text-dim italic">{STAGES[stageIdx]}</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-extrabold leading-none ${goalMet ? "text-brand-light" : "text-text"}`}>
              {dailyPts} <span className="text-[10px] font-normal text-text-dim">/ {effectiveGoal} pts</span>
            </span>
            <button onClick={() => setEditingGoal(v => !v)} className="text-text-dim" aria-label="Edit goal">
              {editingGoal ? <ChevronUp size={12} /> : <Pencil size={11} />}
            </button>
          </div>
        </div>

        {/* goal presets */}
        {editingGoal && (
          <div className="flex gap-1.5 flex-wrap mb-2">
            {GOAL_PRESETS.map(p => (
              <button
                key={p}
                onClick={() => saveGoal(p)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all ${personalGoal === p ? "gradient-brand text-white border-transparent" : "bg-surface border-border text-text-muted"}`}
              >
                {p} pts
              </button>
            ))}
          </div>
        )}

        {/* progress bar */}
        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-dark via-brand-blue to-brand-light transition-all duration-700"
            style={{ width: `${pct * 100}%` }}
          />
        </div>

        {/* caption */}
        <p className={`text-[10px] mt-1.5 ${goalMet ? "text-brand-light font-semibold" : "text-text-dim"}`}>
          {goalMet
            ? "Goal reached — your garden is thriving!"
            : dailyPts > 0
              ? `${effectiveGoal - dailyPts} pts to go — keep going!`
              : "Log a meal, class, or check-in to start growing."}
        </p>
      </div>
    </div>
  );
}
