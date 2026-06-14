import { Info, X } from "lucide-react";

interface ExerciseInfoModalProps {
  name: string;
  meta: string;
  description: string;
  onClose: () => void;
}

export default function ExerciseInfoModal({ name, meta, description, onClose }: ExerciseInfoModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 animate-fade-in-up"
      onClick={onClose}
    >
      <div className="relative w-full max-w-sm gradient-brand p-[1px] rounded-card" onClick={(e) => e.stopPropagation()}>
        <div className="bg-surface rounded-card p-6 animate-pop-in">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-muted"
            aria-label="Close"
          >
            <X size={14} />
          </button>

          <div className="w-11 h-11 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-3">
            <Info size={20} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
          </div>

          <h2 className="text-lg font-bold text-text mb-0.5">{name}</h2>
          <p className="text-xs font-semibold text-brand-light mb-3">{meta}</p>
          <p className="text-sm text-text-muted leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
