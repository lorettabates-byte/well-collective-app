import { Bookmark, Calendar, Check, ChefHat, History, Plus, ShoppingCart, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import type { Recipe } from "../types";

const CHECKED_ITEMS_KEY = "well-shopping-list-checked";
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Sunday-through-Saturday containing today, as actual calendar dates rather
// than abstract weekday names — keeps "this week" unambiguous and lets the
// same screen naturally roll into next week once today passes Saturday.
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

interface PickerProps {
  onPick: (recipe: Recipe) => void;
  onClose: () => void;
}

function RecipePicker({ onPick, onClose }: PickerProps) {
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
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <h2 className="text-sm font-bold text-text">Choose a Recipe</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={18} className="text-text-muted" />
          </button>
        </div>
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
  const [pickerForDate, setPickerForDate] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => loadCheckedItems());

  const weekDates = useMemo(getThisWeekDates, []);
  const todayStr = useMemo(() => toLocalISODate(new Date()), []);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, (typeof mealPlan)[number]>();
    for (const entry of mealPlan) map.set(entry.planDate, entry);
    return map;
  }, [mealPlan]);

  const weekEntries = useMemo(
    () => weekDates.map((date) => entriesByDate.get(date)).filter((e): e is NonNullable<typeof e> => !!e),
    [weekDates, entriesByDate]
  );

  // Exact-string dedupe (case/whitespace-insensitive) — these are free-text
  // AI-generated ingredient lines, not structured quantities, so true
  // unit-aware merging ("1 cup" + "1/2 cup" -> "1.5 cups") isn't reliable.
  // Counting repeats at least tells you "you need this twice this week."
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

  const toggleChecked = (key: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(CHECKED_ITEMS_KEY, JSON.stringify([...next]));
      } catch {
        // localStorage unavailable — checklist just won't persist this session
      }
      return next;
    });
  };

  return (
    <div>
      <TopBar title="Meal Plan" subtitle="Plan your week & build a shopping list" icon={Calendar} iconColor="#0191CE" showBack />
      <div className="px-4 pt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2.5">
          {weekDates.map((date, i) => {
            const entry = entriesByDate.get(date);
            const isToday = date === todayStr;
            return (
              <div
                key={date}
                className={`glass-card rounded-card px-3 py-2.5 flex items-center gap-3 ${
                  isToday ? "border border-brand-light/40" : ""
                }`}
              >
                <div className="w-11 text-center shrink-0">
                  <p className="text-[10px] font-semibold uppercase text-text-dim">{DAY_LABELS[i]}</p>
                  <p className={`text-sm font-bold ${isToday ? "text-brand-light" : "text-text"}`}>
                    {Number(date.slice(8, 10))}
                  </p>
                </div>
                {entry ? (
                  <>
                    <img
                      src={entry.recipe.image}
                      alt={entry.recipe.name}
                      className="w-11 h-11 rounded-card object-cover shrink-0"
                    />
                    <p className="flex-1 min-w-0 text-sm font-semibold text-text truncate">{entry.recipe.name}</p>
                    <button
                      onClick={() => removeMealPlanEntry(entry.id)}
                      aria-label="Remove from meal plan"
                      className="shrink-0 text-text-dim"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setPickerForDate(date)}
                    className="flex-1 flex items-center gap-1.5 text-sm font-medium text-text-muted"
                  >
                    <Plus size={15} />
                    Add a recipe
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="glass-card rounded-card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <ShoppingCart size={16} className="text-brand-light" />
            <h2 className="text-sm font-bold text-text">Shopping List</h2>
          </div>
          {shoppingList.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-6 flex items-center justify-center gap-1.5">
              <Sparkles size={14} />
              Add recipes to the week above to build your list.
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
            </ul>
          )}
        </div>
      </div>

      {pickerForDate && (
        <RecipePicker
          onClose={() => setPickerForDate(null)}
          onPick={(recipe) => {
            setMealPlanRecipe(pickerForDate, recipe);
            setPickerForDate(null);
          }}
        />
      )}
    </div>
  );
}
