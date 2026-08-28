import {
  Award, BookOpen, Coffee, Flame, Flower2, Gift, Globe, Heart,
  Leaf, Moon, Music, Smile, Sparkles, Star, Sun, Waves, X, Save, Trash2
} from "lucide-react";
import { useState } from "react";
import Confetti from "./ui/Confetti";

type AnimationId = "none" | "confetti" | "sparkles" | "hearts" | "balloons";
type GradientId = "ocean" | "sunrise" | "forest" | "lavender" | "rose" | "midnight";

const CARD_ICONS = [
  { id: "heart", icon: Heart, label: "Heart" },
  { id: "sparkles", icon: Sparkles, label: "Sparkles" },
  { id: "star", icon: Star, label: "Star" },
  { id: "sun", icon: Sun, label: "Sun" },
  { id: "flower", icon: Flower2, label: "Flower" },
  { id: "leaf", icon: Leaf, label: "Leaf" },
  { id: "moon", icon: Moon, label: "Moon" },
  { id: "waves", icon: Waves, label: "Waves" },
  { id: "flame", icon: Flame, label: "Flame" },
  { id: "coffee", icon: Coffee, label: "Coffee" },
  { id: "music", icon: Music, label: "Music" },
  { id: "smile", icon: Smile, label: "Smile" },
  { id: "globe", icon: Globe, label: "Globe" },
  { id: "book", icon: BookOpen, label: "Book" },
  { id: "award", icon: Award, label: "Award" },
  { id: "gift", icon: Gift, label: "Gift" },
];

const GRADIENTS: Record<GradientId, { label: string; bg: string; text: string }> = {
  ocean:    { label: "Ocean",    bg: "linear-gradient(135deg,#0191CE 0%,#06b6d4 100%)", text: "#fff" },
  sunrise:  { label: "Sunrise",  bg: "linear-gradient(135deg,#f97316 0%,#facc15 100%)", text: "#fff" },
  forest:   { label: "Forest",   bg: "linear-gradient(135deg,#16a34a 0%,#4ade80 100%)", text: "#fff" },
  lavender: { label: "Lavender", bg: "linear-gradient(135deg,#a855f7 0%,#6366f1 100%)", text: "#fff" },
  rose:     { label: "Rose",     bg: "linear-gradient(135deg,#f43f5e 0%,#fb923c 100%)", text: "#fff" },
  midnight: { label: "Midnight", bg: "linear-gradient(135deg,#1e1b4b 0%,#4c1d95 100%)", text: "#fde68a" },
};

const ANIMATIONS: { id: AnimationId; label: string }[] = [
  { id: "none",     label: "None" },
  { id: "confetti", label: "Confetti" },
  { id: "sparkles", label: "Sparkles" },
  { id: "hearts",   label: "Hearts" },
  { id: "balloons", label: "Balloons" },
];

export interface CustomCard {
  id: string;
  title: string;
  body: string;
  iconId: string;
  gradientId: GradientId;
  animationId: AnimationId;
  createdAt: string;
}

const STORAGE_KEY = "well-custom-cards-v1";

function loadCards(): CustomCard[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s) as CustomCard[];
  } catch { /* ignore */ }
  return [];
}

function saveCards(cards: CustomCard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function FloatingEmoji({ emoji, count = 12 }: { emoji: string; count?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="absolute text-xl animate-bounce"
          style={{
            left: `${5 + (i * 89 / count) % 90}%`,
            top: "110%",
            animation: `floatUp ${1.4 + (i % 4) * 0.3}s ease-in-out ${(i * 0.25) % 2}s infinite`,
          }}
        >
          {emoji}
        </span>
      ))}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0.9; }
          80% { opacity: 0.7; }
          100% { transform: translateY(-200px) scale(0.7); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function CardPreview({ card }: { card: Partial<CustomCard> }) {
  const gradient = GRADIENTS[(card.gradientId as GradientId) ?? "ocean"];
  const iconEntry = CARD_ICONS.find((i) => i.id === card.iconId) ?? CARD_ICONS[0];
  const IconComp = iconEntry.icon;

  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 gap-3 min-h-[160px] shadow-lg"
      style={{ background: gradient.bg }}
    >
      {card.animationId === "confetti" && <Confetti active />}
      {card.animationId === "sparkles" && <FloatingEmoji emoji="✨" />}
      {card.animationId === "hearts" && <FloatingEmoji emoji="💙" />}
      {card.animationId === "balloons" && <FloatingEmoji emoji="🎈" />}

      <div
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-md"
        style={{ background: "rgba(255,255,255,0.2)" }}
      >
        <IconComp size={28} color={gradient.text} />
      </div>
      <div className="text-center z-10">
        <p className="font-bold text-base leading-snug mb-1" style={{ color: gradient.text }}>
          {card.title || "Your title here"}
        </p>
        <p className="text-xs leading-relaxed opacity-90" style={{ color: gradient.text }}>
          {card.body || "Your message here"}
        </p>
      </div>
    </div>
  );
}

export default function CustomCardModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"create" | "saved">("create");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [iconId, setIconId] = useState("heart");
  const [gradientId, setGradientId] = useState<GradientId>("ocean");
  const [animationId, setAnimationId] = useState<AnimationId>("none");
  const [saved, setSaved] = useState<CustomCard[]>(loadCards);

  const handleSave = () => {
    if (!title.trim()) return;
    const card: CustomCard = {
      id: Date.now().toString(),
      title: title.trim(),
      body: body.trim(),
      iconId,
      gradientId,
      animationId,
      createdAt: new Date().toISOString(),
    };
    const next = [card, ...saved];
    saveCards(next);
    setSaved(next);
    setTitle("");
    setBody("");
    setTab("saved");
  };

  const handleDelete = (id: string) => {
    const next = saved.filter((c) => c.id !== id);
    saveCards(next);
    setSaved(next);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center bg-black/60" style={{ paddingBottom: "env(safe-area-inset-bottom,0px)" }}>
      <div className="w-full max-w-lg bg-surface rounded-t-3xl overflow-hidden animate-slide-up" style={{ maxHeight: "92dvh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <p className="text-base font-bold text-text">Custom Card</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border">
            <X size={14} className="text-text-muted" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(["create", "saved"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                tab === t ? "text-brand-light border-b-2 border-brand-light" : "text-text-muted"
              }`}
            >
              {t === "create" ? "Create" : `Saved (${saved.length})`}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(92dvh - 130px)" }}>
          {tab === "create" ? (
            <div className="p-5 flex flex-col gap-4">
              {/* Preview */}
              <CardPreview card={{ title, body, iconId, gradientId, animationId }} />

              {/* Title */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 block">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your card a title"
                  maxLength={50}
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-dim outline-none focus:border-brand-light/50"
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 block">Message</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message here"
                  maxLength={200}
                  rows={3}
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-dim outline-none focus:border-brand-light/50 resize-none"
                />
              </div>

              {/* Icon picker */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Icon</label>
                <div className="grid grid-cols-8 gap-2">
                  {CARD_ICONS.map(({ id, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setIconId(id)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                        iconId === id
                          ? "border-brand-light bg-brand-light/10 text-brand-light"
                          : "border-border bg-surface-2 text-text-muted"
                      }`}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Gradient picker */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Background</label>
                <div className="flex gap-2 flex-wrap">
                  {(Object.entries(GRADIENTS) as [GradientId, typeof GRADIENTS[GradientId]][]).map(([id, g]) => (
                    <button
                      key={id}
                      onClick={() => setGradientId(id)}
                      title={g.label}
                      className={`w-9 h-9 rounded-xl border-2 transition-all ${
                        gradientId === id ? "border-white scale-110" : "border-transparent"
                      }`}
                      style={{ background: g.bg }}
                    />
                  ))}
                </div>
              </div>

              {/* Animation picker */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Animation</label>
                <div className="flex gap-2 flex-wrap">
                  {ANIMATIONS.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setAnimationId(id)}
                      className={`px-3 py-1.5 rounded-pill text-xs font-semibold border transition-all ${
                        animationId === id
                          ? "border-brand-light bg-brand-light/10 text-brand-light"
                          : "border-border bg-surface-2 text-text-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={!title.trim()}
                className="w-full gradient-brand text-white text-sm font-bold rounded-xl py-3 shadow-glow flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Save size={15} />
                Save Card
              </button>
            </div>
          ) : (
            <div className="p-5 flex flex-col gap-4">
              {saved.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles size={32} className="text-text-dim mx-auto mb-3" />
                  <p className="text-sm text-text-muted">No saved cards yet.</p>
                  <p className="text-xs text-text-dim mt-1">Create your first card to see it here.</p>
                  <button
                    onClick={() => setTab("create")}
                    className="mt-4 gradient-brand text-white text-xs font-bold rounded-pill px-5 py-2"
                  >
                    Create a Card
                  </button>
                </div>
              ) : (
                saved.map((card) => (
                  <div key={card.id} className="relative">
                    <CardPreview card={card} />
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center"
                    >
                      <Trash2 size={12} className="text-white" />
                    </button>
                    <p className="text-[10px] text-text-dim mt-1 text-right">
                      {new Date(card.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
