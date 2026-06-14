import { ChefHat, Sparkles } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";

export default function Nutrition() {
  const { currentWeeklyTheme, todaysRecipe } = useApp();

  return (
    <div>
      <TopBar title="Nutrition" subtitle="Recipes inspired by this week's theme" showBack />
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
            <h2 className="text-lg font-bold text-text mb-1.5">{todaysRecipe.name}</h2>
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
