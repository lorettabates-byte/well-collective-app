import { Bookmark, ChefHat, Sparkles } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";

export default function Nutrition() {
  const { user, currentWeeklyTheme, todaysRecipe, toggleRecipeSave } = useApp();
  const [searchParams] = useSearchParams();
  const showSaved = searchParams.get("view") === "saved";

  const savedRecipes = user.savedRecipes ?? [];
  const isSaved = savedRecipes.some((r) => r.name === todaysRecipe.name);

  if (showSaved) {
    return (
      <div>
        <TopBar title="Saved Recipes" subtitle="Recipes you've bookmarked" icon={Bookmark} iconColor="#0191CE" showBack />
        <div className="px-4 pt-4 flex flex-col gap-4">
          {savedRecipes.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-12">
              No saved recipes yet — tap "Save" on a recipe to bookmark it here.
            </p>
          ) : (
            savedRecipes.map((recipe) => (
              <div key={recipe.name} className="glass-card rounded-card overflow-hidden">
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
                  <p className="text-sm text-text-muted leading-relaxed mb-4">{recipe.description}</p>

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
      </div>
    </div>
  );
}
