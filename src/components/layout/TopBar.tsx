import { ChevronLeft, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface TopBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  icon?: LucideIcon;
  iconColor?: string;
  right?: ReactNode;
}

export default function TopBar({ title, subtitle, showBack, icon: Icon, iconColor = "#0191CE", right }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-30 glass-card border-b border-border px-4 pb-4 flex flex-col gap-3" style={{ paddingTop: `max(1.25rem, env(safe-area-inset-top))` }}>
      {Icon && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0">
            <Icon size={20} style={{ color: iconColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-text truncate">{title}</h1>
            {subtitle && <p className="text-xs text-text-muted truncate">{subtitle}</p>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      )}
      {!Icon && (
        <div className="flex items-center gap-3">
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
      )}
    </div>
  );
}
