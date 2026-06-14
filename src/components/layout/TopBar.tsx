import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface TopBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: ReactNode;
}

export default function TopBar({ title, subtitle, showBack, right }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-30 glass-card border-b border-border px-4 pt-5 pb-4 flex items-center gap-3">
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-2 border border-border shrink-0"
          aria-label="Go back"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-text truncate">{title}</h1>
        {subtitle && <p className="text-xs text-text-muted truncate">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
