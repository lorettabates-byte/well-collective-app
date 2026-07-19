import { ChevronDown, Pencil, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ContentBatchEntry } from "../../types";
import { formatDateLong } from "../../utils/format";
import { getRecipePhotoByCategory } from "../../utils/recipePhotos";

interface FutureContentScheduleProps {
  entries: ContentBatchEntry[];
  onEdit: (entry: ContentBatchEntry) => void;
  onDelete: (date: string) => void;
  onRegenerate?: (date: string) => Promise<void>;
  onRegeneratePhoto?: (entry: ContentBatchEntry) => void;
  title?: string;
}

export default function FutureContentSchedule({
  entries,
  onEdit,
  onDelete,
  onRegenerate,
  onRegeneratePhoto,
  title = "Upcoming Content",
}: FutureContentScheduleProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [regenerating, setRegenerating] = useState<Set<string>>(new Set());

  const toggleExpand = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  if (entries.length === 0) {
    return (
      <div className="bg-surface-2 border border-border rounded-card p-4">
        <p className="text-sm text-text-muted">No upcoming content scheduled.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-bold text-text">{title} ({entries.length})</h2>

      <div className="flex flex-col gap-2.5">
        {entries.map((entry) => (
          <div key={entry.date} className="border border-border rounded-card overflow-hidden">
            {/* Header (clickable to expand) */}
            <button
              onClick={() => toggleExpand(entry.date)}
              className="w-full flex items-center justify-between bg-surface-2 hover:bg-surface-3 px-4 py-3 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <ChevronDown
                  size={16}
                  className={`text-brand-light transition-transform ${expandedDates.has(entry.date) ? "rotate-180" : ""}`}
                />
                <div className="text-left min-w-0">
                  <p className="text-sm font-semibold text-text">{formatDateLong(entry.date)}</p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {entry.weeklyTheme && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-brand/20 text-brand-light rounded-pill px-2 py-0.5">
                        Theme
                      </span>
                    )}
                    {entry.dailyInspiration && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-brand/20 text-brand-light rounded-pill px-2 py-0.5">
                        Inspiration
                      </span>
                    )}
                    {entry.wellActivity && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-brand/20 text-brand-light rounded-pill px-2 py-0.5">
                        Activity
                      </span>
                    )}
                    {entry.recipe && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-brand/20 text-brand-light rounded-pill px-2 py-0.5">
                        Recipe
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-1 shrink-0 ml-2">
                {onRegenerate && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setRegenerating((prev) => new Set(prev).add(entry.date));
                      try {
                        await onRegenerate(entry.date);
                      } finally {
                        setRegenerating((prev) => {
                          const next = new Set(prev);
                          next.delete(entry.date);
                          return next;
                        });
                      }
                    }}
                    disabled={regenerating.has(entry.date)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border text-brand-light hover:bg-brand-light hover:text-white transition-colors disabled:opacity-40"
                    aria-label="Regenerate AI content"
                    title="Regenerate AI content"
                  >
                    {regenerating.has(entry.date)
                      ? <RefreshCw size={14} className="animate-spin" />
                      : <Sparkles size={14} />
                    }
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(entry);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border text-brand-light hover:bg-brand-light hover:text-white transition-colors"
                  aria-label="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(entry.date);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border text-red-400 hover:bg-red-400 hover:text-white transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </button>

            {/* Expanded content */}
            {expandedDates.has(entry.date) && (
              <div className="bg-surface border-t border-border px-4 py-4 flex flex-col gap-4">
                {entry.weeklyTheme && (
                  <div className="border-l-2 border-brand-light pl-3">
                    <p className="text-xs font-bold text-brand-light uppercase tracking-wide mb-1">Weekly Theme</p>
                    <p className="text-sm font-semibold text-text">{entry.weeklyTheme.title}</p>
                    <p className="text-xs text-text-muted mt-1">{entry.weeklyTheme.body}</p>
                  </div>
                )}

                {entry.dailyInspiration && (
                  <div className="border-l-2 border-brand-light pl-3">
                    <p className="text-xs font-bold text-brand-light uppercase tracking-wide mb-1">Daily Inspiration</p>
                    <p className="text-sm font-semibold text-text">{entry.dailyInspiration.title}</p>
                    <p className="text-xs text-text-muted mt-1">{entry.dailyInspiration.body}</p>
                  </div>
                )}

                {entry.wellActivity && (
                  <div className="border-l-2 border-brand-light pl-3">
                    <p className="text-xs font-bold text-brand-light uppercase tracking-wide mb-1">Well Activity</p>
                    <p className="text-sm font-semibold text-text">{entry.wellActivity.title}</p>
                    <p className="text-xs text-text-muted mt-1">{entry.wellActivity.description}</p>
                  </div>
                )}

                {entry.recipe && (
                  <div className="border-l-2 border-brand-light pl-3">
                    <p className="text-xs font-bold text-brand-light uppercase tracking-wide mb-1">Recipe</p>
                    {(() => {
                      const recipeImage =
                        entry.recipe.image ||
                        getRecipePhotoByCategory(
                          (entry.recipe as { imageCategory?: string }).imageCategory || "general_healthy",
                          entry.recipe.name
                        );
                      return (
                        <div className="relative mb-2">
                          <img src={recipeImage} alt={entry.recipe.name} className="w-full h-32 object-cover rounded-card" />
                          <div className="absolute top-2 right-2 flex gap-1.5">
                            {onRegeneratePhoto && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRegeneratePhoto(entry);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-white"
                                aria-label="Regenerate photo"
                                title="Regenerate photo"
                              >
                                <RefreshCw size={13} />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(entry);
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-white"
                              aria-label="Use your own photo"
                              title="Use your own photo"
                            >
                              <Pencil size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                    <p className="text-sm font-semibold text-text">{entry.recipe.name}</p>
                    <p className="text-xs text-text-muted mt-1">{entry.recipe.description}</p>
                    {entry.recipe.ingredients && entry.recipe.ingredients.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] font-semibold text-text-dim">Ingredients:</p>
                        <ul className="text-[10px] text-text-muted list-disc list-inside">
                          {entry.recipe.ingredients.slice(0, 3).map((ing, i) => (
                            <li key={i}>{ing}</li>
                          ))}
                          {entry.recipe.ingredients.length > 3 && (
                            <li>+{entry.recipe.ingredients.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
