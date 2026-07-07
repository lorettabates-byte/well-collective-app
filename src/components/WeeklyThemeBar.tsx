import { Sparkles } from "lucide-react";
import type { Inspiration } from "../types";

interface WeeklyThemeBarProps {
  theme: Inspiration | null | undefined;
}

export default function WeeklyThemeBar({ theme }: WeeklyThemeBarProps) {
  if (!theme) return null;

  return (
    <div className="gradient-brand p-[1px] rounded-card">
      <div className="bg-surface/95 rounded-card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full gradient-brand shadow-glow flex items-center justify-center shrink-0">
          <Sparkles size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-light">
            This Week's Theme
          </span>
          <h3 className="text-sm font-bold text-text">{theme.title}</h3>
        </div>
      </div>
    </div>
  );
}
