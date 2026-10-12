import { CalendarX, Play } from "lucide-react";
import { useClassCancellations } from "../hooks/useClassCancellations";
import { useApp } from "../store/AppContext";
import { openMemberLink } from "../utils/ssoLink";

// Shown on Home and Classes from the moment a class is cancelled until that
// class day ends. Text comes from the server so the app and pushes match.
export default function ClassCancellationBanner({ className = "" }: { className?: string }) {
  const { user } = useApp();
  const cancellations = useClassCancellations();
  if (cancellations.length === 0) return null;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {cancellations.map((c) => (
        <div key={c.date} className="gradient-brand p-[1px] rounded-card animate-fade-in-up">
          <div className="bg-surface rounded-card p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <CalendarX size={20} className="text-brand-light shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-text leading-snug">{c.banner}</p>
            </div>
            {c.replacement && (
              <button
                type="button"
                onClick={() => openMemberLink(c.replacement!.url, user.email)}
                className="self-start flex items-center gap-2 gradient-brand rounded-full px-4 py-2 text-sm font-bold text-white"
              >
                <Play size={14} className="fill-white" />
                Dance with this class instead
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
