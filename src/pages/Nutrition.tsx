import { BadgeCheck, Bookmark, ChefHat, Folder, FolderPlus, History, Sparkles, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import type { Recipe, RecipeNutrition } from "../types";

const HISTORY_PAGE_SIZE = 10;

function NutritionInfo({ nutrition, verified }: { nutrition: RecipeNutrition; verified?: boolean }) {
  return (
    <div className="bg-surface-2 border border-border rounded-card p-3 mb-4">
      <div className="grid grid-cols-4 gap-2 text-center mb-2">
        <div>
          <p className="text-sm font-bold text-text">{nutrition.calories}</p>
          <p className="text-[10px] text-text-dim">Calories</p>
        </div>
        <div>
          <p className="text-sm font-bold text-text">{nutrition.protein}</p>
          <p className="text-[10px] text-text-dim">Protein</p>
        </div>
        <div>
          <p className="text-sm font-bold text-text">{nutrition.carbs}</p>
          <p className="text-[10px] text-text-dim">Carbs</p>
        </div>
        <div>
          <p className="text-sm font-bold text-text">{nutrition.fat}</p>
          <p className="text-[10px] text-text-dim">Fat</p>
        </div>
      </div>
      {verified ? (
        <p className="flex items-center justify-center gap-1 text-[10px] text-brand-light">
          <BadgeCheck size={11} />
          Verified against the USDA nutrition database
        </p>
      ) : (
        <p className="text-[10px] text-text-dim text-center">Estimated — not independently verified</p>
      )}
    </div>
  );
}

export default function Nutrition() {
  const {
    currentWeeklyTheme,
    todaysRecipe,
    toggleRecipeSave,
    savedRecipes,
    recipeFolders,
    createRecipeFolder,
    deleteRecipeFolder,
    moveRecipeToFolder,
    fetchRecipeHistory,
  } = useApp();
  const [searchParams] = useSearchParams();
  const showSaved = searchParams.get("view") === "saved";

  const [activeFolderId, setActiveFolderId] = useState<number | "all" | "unsorted">("all");
  const [newFolderName, setNewFolderName] = useState("");
  const [history, setHistory] = useState<Recipe[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExhausted, setHistoryExhausted] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const isSaved = savedRecipes.some((r) => r.name === todaysRecipe.name && r.date === todaysRecipe.date);

  const loadMoreHistory = async () => {
    setHistoryLoading(true);
    const before = history.length > 0 ? history[history.length - 1].date : undefined;
    const next = await fetchRecipeHistory(before, HISTORY_PAGE_SIZE);
    setHistory((prev) => [...prev, ...next]);
    if (next.length < HISTORY_PAGE_SIZE) setHistoryExhausted(true);
    setHistoryLoading(false);
  };

  const openHistory = () => {
    setHistoryOpen(true);
    if (history.length === 0) loadMoreHistory();
  };

  if (showSaved) {
    const visibleRecipes =
      activeFolderId === "all"
        ? savedRecipes
        : activeFolderId === "unsorted"
        ? savedRecipes.filter((r) => !r.folderId)
        : savedRecipes.filter((r) => r.folderId === activeFolderId);

    return (
      <div>
        <TopBar title="Saved Recipes" subtitle="Recipes you've bookmarked" icon={Bookmark} iconColor="#0191CE" showBack />
        <div className="px-4 pt-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveFolderId("all")}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-pill border ${
                activeFolderId === "all" ? "gradient-brand text-white border-transparent" : "border-border text-text-muted"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFolderId("unsorted")}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-pill border ${
                activeFolderId === "unsorted" ? "gradient-brand text-white border-transparent" : "border-border text-text-muted"
              }`}
            >
              Unsorted
            </button>
            {recipeFolders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setActiveFolderId(folder.id)}
                className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-pill border ${
                  activeFolderId === folder.id ? "gradient-brand text-white border-transparent" : "border-border text-text-muted"
                }`}
              >
                <Folder size={12} />
                {folder.name}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newFolderName.trim()) return;
              createRecipeFolder(newFolderName.trim());
              setNewFolderName("");
            }}
            className="flex items-center gap-2"
          >
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder name"
              className="flex-1 bg-surface-2 border border-border rounded-pill px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs font-semibold gradient-brand text-white rounded-pill px-3 py-2 shrink-0"
            >
              <FolderPlus size={14} />
              Add
            </button>
          </form>

          {typeof activeFolderId === "number" && (
            <button
              onClick={() => {
                deleteRecipeFolder(activeFolderId);
                setActiveFolderId("all");
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-400 self-start"
            >
              <Trash2 size={13} />
              Delete this folder
            </button>
          )}

          {visibleRecipes.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-12">
              No saved recipes here yet — tap "Save" on a recipe to bookmark it.
            </p>
          ) : (
            visibleRecipes.map((recipe) => (
              <div key={recipe.id} className="glass-card rounded-card overflow-hidden">
                <img src={recipe.image} alt={recipe.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-text flex-1">{recipe.name}</h2>
                    <button
                      onClick={() => toggleRecipeSave(recipe)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-text-muted"
                    >
                      <Bookmark size={16} className="fill-brand-light text-brand-light" />
                      Saved
                    </button>
                  </div>

                  {recipeFolders.length > 0 && (
                    <select
                      value={recipe.folderId ?? ""}
                      onChange={(e) => moveRecipeToFolder(recipe.id, e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-surface-2 border border-border rounded-card px-3 py-2 text-xs text-text mb-3 focus:outline-none focus:border-brand-blue"
                    >
                      <option value="">No folder</option>
                      {recipeFolders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <p className="text-sm text-text-muted leading-relaxed mb-4">{recipe.description}</p>

                  {recipe.nutrition && <NutritionInfo nutrition={recipe.nutrition} verified={recipe.nutritionVerified} />}

                  <h3 className="text-sm font-bold text-text mb-2">Ingredients</h3>
                  <ul className="flex flex-col gap-1.5 mb-4">
                    {recipe.ingredients.map((ingredient) => (
                      <li key={ingredient} className="flex items-start gap-2 text-sm text-text-muted">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-light mt-1.5 shrink-0" />
                        {ingredient}
                      </li>
                    ))}
                  </ul>

                  <h3 className="text-sm font-bold text-text mb-2">Steps</h3>
                  <ol className="flex flex-col gap-2">
                    {recipe.steps.map((step, index) => (
                      <li key={step} className="flex items-start gap-2.5 text-sm text-text-muted">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-2 border border-border text-[11px] font-bold text-brand-light shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Nutrition" subtitle="Recipes inspired by this week's theme" icon={ChefHat} iconColor="#0191CE" showBack />
      <div className="px-4 pt-4 flex flex-col gap-4">
        {currentWeeklyTheme && (
          <div className="gradient-brand p-[1px] rounded-card">
            <div className="bg-surface/95 rounded-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-brand shadow-glow flex items-center justify-center shrink-0">
                <Sparkles size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-light">
                  This Week's Theme
                </span>
                <h3 className="text-sm font-bold text-text">{currentWeeklyTheme.title}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="glass-card rounded-card overflow-hidden">
          <img src={todaysRecipe.image} alt={todaysRecipe.name} className="w-full h-48 object-cover" />
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ChefHat size={16} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-light">
                Today's Recipe
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-text flex-1">{todaysRecipe.name}</h2>
              <button
                onClick={() => toggleRecipeSave(todaysRecipe)}
                className="flex items-center gap-1.5 text-xs font-semibold text-text-muted"
              >
                <Bookmark
                  size={16}
                  className={isSaved ? "fill-brand-light text-brand-light" : ""}
                />
                {isSaved ? "Saved" : "Save"}
              </button>
            </div>
            <p className="text-sm text-text-muted leading-relaxed mb-4">{todaysRecipe.description}</p>

            {todaysRecipe.nutrition && (
              <NutritionInfo nutrition={todaysRecipe.nutrition} verified={todaysRecipe.nutritionVerified} />
            )}

            <h3 className="text-sm font-bold text-text mb-2">Ingredients</h3>
            <ul className="flex flex-col gap-1.5 mb-4">
              {todaysRecipe.ingredients.map((ingredient) => (
                <li key={ingredient} className="flex items-start gap-2 text-sm text-text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-light mt-1.5 shrink-0" />
                  {ingredient}
                </li>
              ))}
            </ul>

            <h3 className="text-sm font-bold text-text mb-2">Steps</h3>
            <ol className="flex flex-col gap-2">
              {todaysRecipe.steps.map((step, index) => (
                <li key={step} className="flex items-start gap-2.5 text-sm text-text-muted">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-2 border border-border text-[11px] font-bold text-brand-light shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <a
            href="/nutrition?view=saved"
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-text-muted border border-border rounded-pill py-2.5"
          >
            <Bookmark size={14} />
            Saved Recipes
            {savedRecipes.length > 0 && (
              <span className="text-[10px] font-bold bg-surface-3 text-brand-light rounded-pill px-1.5 py-0.5">
                {savedRecipes.length}
              </span>
            )}
          </a>
          <button
            onClick={openHistory}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-text-muted border border-border rounded-pill py-2.5"
          >
            <History size={14} />
            Past Recipes
          </button>
        </div>

        {historyOpen && (
          <div className="glass-card rounded-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text">Past Recipes</h3>
              <button onClick={() => setHistoryOpen(false)} aria-label="Close past recipes">
                <X size={16} className="text-text-muted" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {history.map((recipe) => {
                const recipeSaved = savedRecipes.some((r) => r.name === recipe.name && r.date === recipe.date);
                return (
                  <div key={`${recipe.date}-${recipe.name}`} className="flex items-center gap-3 border-b border-border pb-3 last:border-none last:pb-0">
                    <img src={recipe.image} alt={recipe.name} className="w-14 h-14 rounded-card object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-dim">{recipe.date}</p>
                      <h4 className="text-sm font-semibold text-text truncate">{recipe.name}</h4>
                    </div>
                    <button
                      onClick={() => toggleRecipeSave(recipe)}
                      className="shrink-0"
                      aria-label={recipeSaved ? "Unsave recipe" : "Save recipe"}
                    >
                      <Bookmark size={18} className={recipeSaved ? "fill-brand-light text-brand-light" : "text-text-muted"} />
                    </button>
                  </div>
                );
              })}
              {history.length === 0 && !historyLoading && (
                <p className="text-sm text-text-muted text-center py-4">No past recipes found yet.</p>
              )}
              {!historyExhausted && (
                <button
                  onClick={loadMoreHistory}
                  disabled={historyLoading}
                  className="text-xs font-semibold text-brand-light disabled:opacity-50 self-center mt-1"
                >
                  {historyLoading ? "Loading…" : "Load more"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
