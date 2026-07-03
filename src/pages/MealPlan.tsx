import { Bookmark, Calendar, Check, ChefHat, ChevronDown, ChevronUp, History, Plus, ShoppingCart, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import type { MealPlanEntry, Recipe } from "../types";

const CHECKED_ITEMS_KEY = "well-shopping-list-checked";
const MANUAL_ITEMS_KEY = "well-shopping-list-manual";
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast", emoji: "🌅" },
  { id: "lunch",     label: "Lunch",     emoji: "☀️" },
  { id: "dinner",    label: "Dinner",    emoji: "🌙" },
  { id: "snack",     label: "Snack",     emoji: "🍎" },
];

function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getThisWeekDates(): string[] {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return toLocalISODate(d);
  });
}

function loadCheckedItems(): Set<string> {
  try {
    const raw = localStorage.getItem(CHECKED_ITEMS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function loadManualItems(): string[] {
  try {
    const raw = localStorage.getItem(MANUAL_ITEMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

interface PickerProps {
  onPick: (recipe: Recipe) => void;
  onClose: () => void;
  mealLabel: string;
}

function RecipePicker({ onPick, onClose, mealLabel }: PickerProps) {
  const { todaysRecipe, savedRecipes, fetchRecipeHistory } = useApp();
  const [tab, setTab] = useState<"today" | "saved" | "history">("today");
  const [history, setHistory] = useState<Recipe[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (tab !== "history" || history.length > 0) return;
    setHistoryLoading(true);
    fetchRecipeHistory(undefined, 20)
      .then(setHistory)
      .finally(() => setHistoryLoading(false));
  }, [tab, history.length, fetchRecipeHistory]);

  const TABS = [
    { id: "today" as const, label: "Today", icon: ChefHat },
    { id: "saved" as const, label: "Saved", icon: Bookmark },
    { id: "history" as const, label: "Past", icon: History },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-surface rounded-card flex flex-col"
        style={{ maxHeight: "min(80dvh, 640px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-1 shrink-0">
          <h2 className="text-sm font-bold text-text">Choose a Recipe</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={18} className="text-text-muted" />
          </button>
        </div>
        <p className="px-4 pb-2 text-xs text-text-muted shrink-0">Adding to {mealLabel}</p>
        <div className="flex gap-2 px-4 pb-3 shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-pill ${
                tab === t.id ? "gradient-brand text-white" : "bg-surface-2 text-text-muted border border-border"
              }`}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-2">
          {tab === "today" && (
            <button
              onClick={() => onPick(todaysRecipe)}
              className="flex items-center gap-3 glass-card rounded-card px-3 py-2.5 text-left"
            >
              <img src={todaysRecipe.image} alt="" className="w-12 h-12 rounded-card object-cover shrink-0" />
              <span className="text-sm font-semibold text-text">{todaysRecipe.name}</span>
            </button>
          )}
          {tab === "saved" && (
            savedRecipes.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">No saved recipes yet.</p>
            ) : (
              savedRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => onPick(recipe)}
                  className="flex items-center gap-3 glass-card rounded-card px-3 py-2.5 text-left"
                >
                  <img src={recipe.image} alt="" className="w-12 h-12 rounded-card object-cover shrink-0" />
                  <span className="text-sm font-semibold text-text">{recipe.name}</span>
                </button>
              ))
            )
          )}
          {tab === "history" && (
            historyLoading ? (
              <p className="text-sm text-text-muted text-center py-6">Loading…</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">No past recipes found.</p>
            ) : (
              history.map((recipe) => (
                <button
                  key={`${recipe.date}-${recipe.name}`}
                  onClick={() => onPick(recipe)}
                  className="flex items-center gap-3 glass-card rounded-card px-3 py-2.5 text-left"
                >
                  <img src={recipe.image} alt="" className="w-12 h-12 rounded-card object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-text-dim">{recipe.date}</p>
                    <p className="text-sm font-semibold text-text truncate">{recipe.name}</p>
                  </div>
                </button>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function MealPlan() {
  const { mealPlan, setMealPlanRecipe, removeMealPlanEntry } = useApp();
  const [pickerFor, setPickerFor] = useState<{ date: string; mealType: string; label: string } | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => loadCheckedItems());
  const [manualItems, setManualItems] = useState<string[]>(() => loadManualItems());
  const [manualInput, setManualInput] = useState("");

  const weekDates = useMemo(getThisWeekDates, []);
  const todayStr = useMemo(() => toLocalISODate(new Date()), []);

  // Start with today expanded
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() => new Set([toLocalISODate(new Date())]));

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  // Map: date -> mealType -> entry
  const entriesByDate = useMemo(() => {
    const map = new Map<string, Map<string, MealPlanEntry>>();
    for (const entry of mealPlan) {
      if (!map.has(entry.planDate)) map.set(entry.planDate, new Map());
      map.get(entry.planDate)!.set(entry.mealType, entry);
    }
    return map;
  }, [mealPlan]);

  // All entries this week (for shopping list)
  const weekEntries = useMemo(() => {
    const entries: MealPlanEntry[] = [];
    for (const date of weekDates) {
      const dayMap = entriesByDate.get(date);
      if (dayMap) entries.push(...dayMap.values());
    }
    return entries;
  }, [weekDates, entriesByDate]);

  const shoppingList = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of weekEntries) {
      for (const ingredient of entry.recipe.ingredients) {
        const key = ingredient.trim().toLowerCase();
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([key, count]) => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [weekEntries]);

  const addManualItem = () => {
    const trimmed = manualInput.trim();
    if (!trimmed) return;
    const next = [...manualItems, trimmed];
    setManualItems(next);
    setManualInput("");
    try { localStorage.setItem(MANUAL_ITEMS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const removeManualItem = (index: number) => {
    const next = manualItems.filter((_, i) => i !== index);
    setManualItems(next);
    try { localStorage.setItem(MANUAL_ITEMS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const toggleChecked = (key: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try { localStorage.setItem(CHECKED_ITEMS_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <div>
      <TopBar title="Meal Plan" subtitle="Plan your week & build a shopping list" icon={Calendar} iconColor="#0191CE" showBack />
      <div className="px-4 pt-4 flex flex-col gap-2.5">

        {weekDates.map((date, i) => {
          const dayMap = entriesByDate.get(date) ?? new Map<string, MealPlanEntry>();
          const mealCount = dayMap.size;
          const isToday = date === todayStr;
          const isExpanded = expandedDays.has(date);

          // Show dinner photo on the bar; fall back to whichever single meal is set
          const previewEntry = dayMap.get("dinner") ?? (mealCount === 1 ? [...dayMap.values()][0] : undefined);

          return (
            <div
              key={date}
              className={`glass-card rounded-card overflow-hidden ${isToday ? "border border-brand-light/40" : ""}`}
            >
              {/* Day header — always visible, tap to expand */}
              <button
                onClick={() => toggleDay(date)}
                className="w-full flex items-center gap-3 px-3 py-2.5"
              >
                <div className="w-11 text-center shrink-0">
                  <p className="text-[10px] font-semibold uppercase text-text-dim">{DAY_LABELS[i]}</p>
                  <p className={`text-sm font-bold ${isToday ? "text-brand-light" : "text-text"}`}>
                    {Number(date.slice(8, 10))}
                  </p>
                </div>
                {previewEntry ? (
                  <img
                    src={previewEntry.recipe.image}
                    alt={previewEntry.recipe.name}
                    className="w-9 h-9 rounded-md object-cover shrink-0"
                  />
                ) : null}
                <div className="flex-1 text-left min-w-0">
                  {mealCount > 0 ? (
                    <p className="text-xs font-medium text-text truncate">
                      {previewEntry ? previewEntry.recipe.name : `${mealCount} meal${mealCount !== 1 ? "s" : ""} planned`}
                    </p>
                  ) : (
                    <p className="text-xs text-text-muted">Tap to plan meals</p>
                  )}
                  {mealCount > 1 && previewEntry && (
                    <p className="text-[10px] text-text-dim">{mealCount} meals planned</p>
                  )}
                </div>
                {isExpanded
                  ? <ChevronUp size={15} className="text-text-dim shrink-0" />
                  : <ChevronDown size={15} className="text-text-dim shrink-0" />
                }
              </button>

              {/* Expanded meal slots */}
              {isExpanded && (
                <div className="border-t border-border">
                  {MEAL_TYPES.map((mt, mtIdx) => {
                    const entry = dayMap.get(mt.id);
                    return (
                      <div
                        key={mt.id}
                        className={`flex items-center gap-2.5 px-3 py-2 ${mtIdx < MEAL_TYPES.length - 1 ? "border-b border-border" : ""}`}
                      >
                        <span className="text-base w-5 text-center shrink-0">{mt.emoji}</span>
                        <span className="text-[11px] font-semibold text-text-dim w-16 shrink-0">{mt.label}</span>
                        {entry ? (
                          <>
                            <img
                              src={entry.recipe.image}
                              alt={entry.recipe.name}
                              className="w-8 h-8 rounded-md object-cover shrink-0"
                            />
                            <p className="flex-1 min-w-0 text-xs font-medium text-text truncate">
                              {entry.recipe.name}
                            </p>
                            <button
                              onClick={() => removeMealPlanEntry(entry.id)}
                              aria-label={`Remove ${mt.label}`}
                              className="shrink-0 text-text-dim p-1"
                            >
                              <X size={13} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setPickerFor({ date, mealType: mt.id, label: mt.label })}
                            className="flex-1 flex items-center gap-1 text-xs text-text-muted"
                          >
                            <Plus size={13} />
                            Add {mt.label.toLowerCase()}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="glass-card rounded-card p-4 mt-1.5">
          <div className="flex items-center gap-1.5 mb-3">
            <ShoppingCart size={16} className="text-brand-light" />
            <h2 className="text-sm font-bold text-text">Shopping List</h2>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addManualItem()}
              placeholder="Add an item…"
              className="flex-1 bg-surface-2 border border-border rounded-card px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
            />
            <button
              onClick={addManualItem}
              disabled={!manualInput.trim()}
              className="w-9 h-9 flex items-center justify-center gradient-brand text-white rounded-card disabled:opacity-40"
            >
              <Plus size={16} />
            </button>
          </div>

          {shoppingList.length === 0 && manualItems.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4 flex items-center justify-center gap-1.5">
              <Sparkles size={14} />
              Add recipes above or type items manually.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {shoppingList.map((item) => {
                const checked = checkedItems.has(item.key);
                return (
                  <li key={item.key}>
                    <button
                      onClick={() => toggleChecked(item.key)}
                      className="flex items-center gap-2.5 w-full text-left"
                    >
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          checked ? "bg-brand-light border-brand-light" : "border-border"
                        }`}
                      >
                        {checked && <Check size={13} className="text-white" />}
                      </span>
                      <span className={`text-sm flex-1 ${checked ? "text-text-dim line-through" : "text-text"}`}>
                        {item.label}
                      </span>
                      {item.count > 1 && (
                        <span className="text-[10px] font-bold bg-surface-3 text-brand-light rounded-pill px-1.5 py-0.5 shrink-0">
                          ×{item.count}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
              {manualItems.map((item, i) => {
                const key = `manual-${i}-${item}`;
                const checked = checkedItems.has(key);
                return (
                  <li key={key} className="flex items-center gap-2.5">
                    <button
                      onClick={() => toggleChecked(key)}
                      className="flex items-center gap-2.5 flex-1 text-left"
                    >
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          checked ? "bg-brand-light border-brand-light" : "border-border"
                        }`}
                      >
                        {checked && <Check size={13} className="text-white" />}
                      </span>
                      <span className={`text-sm flex-1 ${checked ? "text-text-dim line-through" : "text-text"}`}>
                        {item}
                      </span>
                    </button>
                    <button onClick={() => removeManualItem(i)} className="text-text-dim shrink-0 p-1">
                      <X size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {pickerFor && (
        <RecipePicker
          mealLabel={pickerFor.label}
          onClose={() => setPickerFor(null)}
          onPick={(recipe) => {
            setMealPlanRecipe(pickerFor.date, pickerFor.mealType, recipe);
            setPickerFor(null);
          }}
        />
      )}
    </div>
  );
}
