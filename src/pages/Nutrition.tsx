import { Apple, ArrowLeft, BadgeCheck, Bookmark, Calendar, Camera, ChefHat, Droplets, Dumbbell, Folder, FolderPlus, History, Leaf, Minus, Pencil, Plus, Salad, ScanLine, Trash2, Wand2, Wheat, X } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import SectionIntroModal from "../components/SectionIntroModal";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import { useSectionTracking } from "../hooks/useSectionTracking";
import type { Recipe, RecipeNutrition } from "../types";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface SavedMeal {
  id: number;
  name: string;
  mealType: string;
  estimatedCalories: number | null;
  estimatedProteinG: number | null;
  estimatedCarbsG: number | null;
  estimatedFatG: number | null;
}

interface MealEntry {
  id: number;
  meal_type: string;
  had_protein: boolean;
  had_vegetable: boolean;
  had_water: boolean;
  had_fruit: boolean;
  had_whole_foods: boolean;
  notes: string | null;
  estimated_calories: number | null;
  estimated_protein_g: number | null;
  estimated_carbs_g: number | null;
  estimated_fat_g: number | null;
  nutrition_verified: boolean | null;
  logged_at: string;
}

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
type MealType = (typeof MEAL_TYPES)[number];

const MEAL_TYPE_STYLE: Record<string, { bg: string; border: string; accent: string }> = {
  Breakfast: { bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.28)",  accent: "#FCD34D" },
  Lunch:     { bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.28)",  accent: "#34D399" },
  Dinner:    { bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.28)", accent: "#A78BFA" },
  Snack:     { bg: "rgba(251,146,60,0.08)",  border: "rgba(251,146,60,0.28)",  accent: "#FB923C" },
};

const HISTORY_PAGE_SIZE = 10;

function CalorieStat({ kcal, label }: { kcal: number; label: string }) {
  return (
    <div>
      <p className="text-sm font-bold text-text">{Math.round(kcal).toLocaleString()}</p>
      <p className="text-[10px] text-text-dim mt-0.5">{label}</p>
    </div>
  );
}

function GramStat({ grams, label }: { grams: number; label: string }) {
  return (
    <div>
      <p className="text-sm font-bold text-text">{Math.round(grams)}g</p>
      <p className="text-[10px] text-text-dim mt-0.5">{label}</p>
    </div>
  );
}

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
        <p className="text-[10px] text-text-dim text-center">Estimated — not independently verified. For more accurate results, enter food items manually using the text field below.</p>
      )}
    </div>
  );
}

export default function Nutrition() {
  useSectionTracking("nutrition");
  const {
    todaysRecipe,
    toggleRecipeSave,
    savedRecipes,
    recipeFolders,
    createRecipeFolder,
    deleteRecipeFolder,
    moveRecipeToFolder,
    fetchRecipeHistory,
    user,
  } = useApp();
  const [searchParams] = useSearchParams();
  const showSaved = searchParams.get("view") === "saved";

  // ── Meal logging ──────────────────────────────────────────────────────────
  const [todaysMeals, setTodaysMeals] = useState<MealEntry[]>([]);
  const [showMealForm, setShowMealForm] = useState(false);
  const [mealType, setMealType] = useState<MealType>("Breakfast");
  const [hadProtein, setHadProtein] = useState(false);
  const [hadVegetable, setHadVegetable] = useState(false);
  const [hadWater, setHadWater] = useState(false);
  const [hadFruit, setHadFruit] = useState(false);
  const [hadWholeFoods, setHadWholeFoods] = useState(false);
  const [estimatedCalories, setEstimatedCalories] = useState("");
  const [mealNotes, setMealNotes] = useState("");
  const [savingMeal, setSavingMeal] = useState(false);

  // Calorie estimator — add one food item at a time, USDA-backed lookup fills
  // in each item's per-serving nutrition, and the meal's totals are the sum
  // across all items, each multiplied by its own servings count.
  interface MealItemEstimate {
    description: string;
    calories: number; // per serving
    protein: number;
    carbs: number;
    fat: number;
    verified: boolean;
    servings: number;
  }
  const [mealItemInput, setMealItemInput] = useState("");
  const [mealItems, setMealItems] = useState<MealItemEstimate[]>([]);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState("");

  // Barcode scanning state
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  // Photo scan state
  const [photoScanning, setPhotoScanning] = useState(false);
  const [photoScanError, setPhotoScanError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const mealFormRef = useRef<HTMLDivElement>(null);

  const handlePhotoScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !API_URL) return;
    setPhotoScanning(true);
    setPhotoScanError("");
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Strip "data:image/jpeg;base64," prefix — server only wants the raw base64
          resolve(result.split(",")[1] ?? "");
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch(`${API_URL}/api/meals/scan-photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type || "image/jpeg" }),
      });
      const data = await res.json() as {
        items?: { label: string; calories: number; protein: number; carbs: number; fat: number }[];
        error?: string;
      };
      if (!res.ok || !data.items?.length) {
        setPhotoScanError(data.error ?? "No food detected — try a clearer photo or enter food manually.");
      } else {
        setMealItems((prev) => {
          const next = [
            ...prev,
            ...data.items!.map((i) => ({
              description: i.label,
              calories: Math.round(i.calories),
              protein: Math.round(i.protein),
              carbs: Math.round(i.carbs),
              fat: Math.round(i.fat),
              verified: false,
              servings: 1,
            })),
          ];
          setMealNotes(next.map((i) => i.description).join(", "));
          return next;
        });
        if (!showMealForm) setShowMealForm(true);
      }
    } catch {
      setPhotoScanError("Photo scan failed — check your connection and try again.");
    } finally {
      setPhotoScanning(false);
      // Reset so the same file can be re-selected if needed
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleBarcodeScan = async () => {
    if (!Capacitor.isNativePlatform()) {
      setScanError("Barcode scanning requires the native app (iOS or Android).");
      return;
    }
    setScanError("");
    setScanning(true);
    try {
      const { BarcodeScanner } = await import("@capacitor-community/barcode-scanner");
      const perm = await BarcodeScanner.checkPermission({ force: true });
      if (!perm.granted) {
        setScanError("Camera permission is required to scan barcodes.");
        setScanning(false);
        return;
      }
      await BarcodeScanner.prepare();
      const result = await BarcodeScanner.startScan();
      await BarcodeScanner.stopScan();
      if (!result.hasContent || !result.content) {
        setScanning(false);
        return;
      }
      const barcode = result.content;
      // Look up nutrition data from Open Food Facts (free, no key required)
      const offRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}?fields=product_name,nutriments,serving_size,brands`);
      if (!offRes.ok) throw new Error("Product not found");
      const offData = await offRes.json() as {
        status: number;
        product?: {
          product_name?: string;
          brands?: string;
          serving_size?: string;
          nutriments?: {
            "energy-kcal_serving"?: number;
            "energy-kcal_100g"?: number;
            "proteins_serving"?: number;
            "proteins_100g"?: number;
            "carbohydrates_serving"?: number;
            "carbohydrates_100g"?: number;
            "fat_serving"?: number;
            "fat_100g"?: number;
          };
        };
      };
      if (offData.status !== 1 || !offData.product) {
        setScanError("Product not found in Open Food Facts database. Try typing it manually.");
        setScanning(false);
        return;
      }
      const p = offData.product;
      const n = p.nutriments ?? {};
      const name = [p.brands, p.product_name].filter(Boolean).join(" — ") || "Scanned product";
      const cal = n["energy-kcal_serving"] ?? n["energy-kcal_100g"] ?? 0;
      const protein = n["proteins_serving"] ?? n["proteins_100g"] ?? 0;
      const carbs = n["carbohydrates_serving"] ?? n["carbohydrates_100g"] ?? 0;
      const fat = n["fat_serving"] ?? n["fat_100g"] ?? 0;
      setMealItems((prev) => {
        const next = [...prev, { description: name, calories: Math.round(cal), protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat), verified: true, servings: 1 }];
        setMealNotes(next.map((i) => i.description).join(", "));
        return next;
      });
      setEstimatedCalories(String(Math.round(cal)));
      if (!showMealForm) setShowMealForm(true);
    } catch (err) {
      setScanError("Scan failed. Try again or enter food manually.");
      console.error("Barcode scan error:", err);
    } finally {
      setScanning(false);
    }
  };

  const totalEstimated = mealItems.reduce(
    (sum, i) => ({
      calories: sum.calories + i.calories * i.servings,
      protein: sum.protein + i.protein * i.servings,
      carbs: sum.carbs + i.carbs * i.servings,
      fat: sum.fat + i.fat * i.servings,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const allVerified = mealItems.length > 0 && mealItems.every((i) => i.verified);

  const handleAddMealItem = async () => {
    if (!API_URL || !mealItemInput.trim() || estimating) return;
    setEstimating(true);
    setEstimateError("");
    try {
      const res = await fetch(`${API_URL}/api/meals/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: mealItemInput.trim() }),
      });
      if (res.ok) {
        const data = await res.json() as {
          items?: { label: string; calories: number; protein: number; carbs: number; fat: number; verified: boolean }[];
          calories: number; protein: number; carbs: number; fat: number; verified: boolean;
        };
        // The server splits "eggs, ham, and orange juice" into one row per
        // food so each can be adjusted or removed on its own.
        const rows = data.items?.length
          ? data.items.map((i) => ({ description: i.label, calories: i.calories, protein: i.protein, carbs: i.carbs, fat: i.fat, verified: i.verified, servings: 1 }))
          : [{ description: mealItemInput.trim(), calories: data.calories, protein: data.protein, carbs: data.carbs, fat: data.fat, verified: data.verified, servings: 1 }];
        setMealItems((prev) => {
          const next = [...prev, ...rows];
          setMealNotes(next.map((i) => i.description).join(", "));
          return next;
        });
        setMealItemInput("");
      } else {
        setEstimateError("Couldn't estimate that item — try being more specific, or enter calories manually below.");
      }
    } catch {
      setEstimateError("Couldn't reach the estimator — try again in a moment.");
    } finally {
      setEstimating(false);
    }
  };

  const removeMealItem = (index: number) => {
    setMealItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setMealNotes(next.map((i) => i.description).join(", "));
      return next;
    });
  };

  const updateMealItemServings = (index: number, delta: number) => {
    setMealItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next = Math.round((item.servings + delta * 0.25) * 100) / 100;
        return { ...item, servings: Math.max(0.25, Math.min(20, next)) };
      })
    );
  };

  const formatServings = (s: number) => {
    const whole = Math.floor(s);
    const frac = Math.round((s - whole) * 4);
    const fracStr = frac === 1 ? "¼" : frac === 2 ? "½" : frac === 3 ? "¾" : "";
    return whole === 0 ? `${fracStr}×` : fracStr ? `${whole}${fracStr}×` : `${whole}×`;
  };

  useEffect(() => {
    if (!API_URL || !user.email) return;
    fetch(`${API_URL}/api/meals/today?email=${encodeURIComponent(user.email)}`)
      .then((r) => (r.ok ? r.json() : { meals: [] }))
      .then((d) => setTodaysMeals(d.meals || []))
      .catch(() => {});
  }, [user.email]);

  // ── Saved meals (quick reuse of commonly eaten meals) ──────────────────────
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [showSaveMealPrompt, setShowSaveMealPrompt] = useState(false);
  const [saveMealName, setSaveMealName] = useState("");
  const [savingSavedMeal, setSavingSavedMeal] = useState(false);

  useEffect(() => {
    if (!API_URL || !user.email) return;
    fetch(`${API_URL}/api/meals/saved?email=${encodeURIComponent(user.email)}`)
      .then((r) => (r.ok ? r.json() : { saved: [] }))
      .then((d) => setSavedMeals(d.saved || []))
      .catch(() => {});
  }, [user.email]);

  const handleSaveMeal = async () => {
    if (!API_URL || !user.email || !saveMealName.trim() || savingSavedMeal) return;
    setSavingSavedMeal(true);
    const nutrition = mealItems.length > 0
      ? {
          estimatedCalories: Math.round(totalEstimated.calories),
          estimatedProteinG: Math.round(totalEstimated.protein),
          estimatedCarbsG: Math.round(totalEstimated.carbs),
          estimatedFatG: Math.round(totalEstimated.fat),
        }
      : { estimatedCalories: estimatedCalories ? parseInt(estimatedCalories, 10) : undefined };
    try {
      const res = await fetch(`${API_URL}/api/meals/saved`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, name: saveMealName.trim(), mealType, ...nutrition }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedMeals((prev) => [data.saved, ...prev.filter((m) => m.id !== data.saved.id)]);
        setShowSaveMealPrompt(false);
        setSaveMealName("");
      }
    } catch { /* silent */ } finally {
      setSavingSavedMeal(false);
    }
  };

  const handleDeleteSavedMeal = async (id: number) => {
    if (!API_URL) return;
    setSavedMeals((prev) => prev.filter((m) => m.id !== id));
    try {
      await fetch(`${API_URL}/api/meals/saved/${id}`, { method: "DELETE" });
    } catch { /* silent */ }
  };

  const handleLoadSavedMeal = (meal: SavedMeal) => {
    setMealType((MEAL_TYPES.find((t) => t === meal.mealType) ?? mealType) as MealType);
    setMealItems([{
      description: meal.name,
      calories: meal.estimatedCalories ?? 0,
      protein: meal.estimatedProteinG ?? 0,
      carbs: meal.estimatedCarbsG ?? 0,
      fat: meal.estimatedFatG ?? 0,
      verified: false,
      servings: 1,
    }]);
    setEstimateError("");
  };

  const todaysMealTotals = todaysMeals.reduce(
    (sum, m) => ({
      calories: sum.calories + Number(m.estimated_calories ?? 0),
      protein: sum.protein + Number(m.estimated_protein_g ?? 0),
      carbs: sum.carbs + Number(m.estimated_carbs_g ?? 0),
      fat: sum.fat + Number(m.estimated_fat_g ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const hasTrackedNutrition = todaysMeals.some((m) => m.estimated_calories != null);

  // When set, the form is editing an existing logged meal instead of adding
  // a new one — Save issues a PUT and no extra points are awarded.
  const [editingMealId, setEditingMealId] = useState<number | null>(null);

  const resetMealForm = () => {
    setShowMealForm(false);
    setEditingMealId(null);
    setHadProtein(false); setHadVegetable(false);
    setHadWater(false); setHadFruit(false);
    setHadWholeFoods(false); setEstimatedCalories("");
    setMealNotes("");
    setMealItemInput(""); setMealItems([]); setEstimateError("");
  };

  const startEditMeal = (meal: MealEntry) => {
    setEditingMealId(meal.id);
    setMealType((MEAL_TYPES.find((t) => t === meal.meal_type) ?? "Breakfast") as MealType);
    setHadProtein(meal.had_protein);
    setHadVegetable(meal.had_vegetable);
    setHadWater(meal.had_water);
    setHadFruit(meal.had_fruit);
    setHadWholeFoods(meal.had_whole_foods);
    setMealItems([]);
    setMealNotes(meal.notes ?? "");
    setEstimatedCalories(meal.estimated_calories != null ? String(meal.estimated_calories) : "");
    setEstimateError("");
    setShowMealForm(true);
    setTimeout(() => {
      mealFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleDeleteMeal = async (mealId: number) => {
    if (!API_URL || !user.email) return;
    try {
      const res = await fetch(`${API_URL}/api/meals/${mealId}?email=${encodeURIComponent(user.email)}`, { method: "DELETE" });
      if (res.ok) {
        setTodaysMeals((prev) => prev.filter((m) => m.id !== mealId));
        if (editingMealId === mealId) resetMealForm();
      }
    } catch { /* silent */ }
  };

  const handleLogMeal = async () => {
    if (!API_URL || !user.email || savingMeal) return;
    setSavingMeal(true);
    const isEdit = editingMealId != null;
    // Fresh estimator rows win; otherwise keep whatever calories are in the
    // manual field (which is prefilled from the meal when editing).
    const notesValue = mealItems.length > 0
      ? mealItems.map((i) => i.description).join(", ")
      : mealNotes.trim() || undefined;
    const nutritionBody = mealItems.length > 0
      ? {
          estimatedCalories: Math.round(totalEstimated.calories),
          estimatedProtein: Math.round(totalEstimated.protein),
          estimatedCarbs: Math.round(totalEstimated.carbs),
          estimatedFat: Math.round(totalEstimated.fat),
          nutritionVerified: allVerified,
        }
      : {
          estimatedCalories: estimatedCalories ? parseInt(estimatedCalories, 10) : undefined,
        };
    try {
      const res = await fetch(isEdit ? `${API_URL}/api/meals/${editingMealId}` : `${API_URL}/api/meals`, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberEmail: user.email,
          mealType,
          hadProtein,
          hadVegetable,
          hadWater,
          hadFruit,
          hadWholeFoods,
          notes: notesValue,
          ...nutritionBody,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (isEdit) {
          setTodaysMeals((prev) => prev.map((m) => (m.id === editingMealId ? data.meal : m)));
          resetMealForm();
          setSavingMeal(false);
          return;
        }
        setTodaysMeals((prev) => [...prev, data.meal]);
        resetMealForm();
      }
    } catch { /* silent */ } finally {
      setSavingMeal(false);
    }
  };

  // ── Water tracker ─────────────────────────────────────────────────────────
  const WATER_GOAL = 8;
  const GLASS_OZ = 8;
  const WATER_GOAL_OZ = WATER_GOAL * GLASS_OZ;
  const todayIso = new Date().toISOString().slice(0, 10);
  const waterKey = `well-water-${todayIso}-${user.email}`;
  const waterOzKey = `well-water-oz-${todayIso}-${user.email}`;
  const [waterOz, setWaterOz] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(waterOzKey);
      if (stored !== null) return Math.max(0, parseFloat(stored) || 0);
      // migrate from old glasses key
      const oldGlasses = parseInt(localStorage.getItem(waterKey) ?? "0", 10) || 0;
      if (oldGlasses > 0) { const oz = oldGlasses * GLASS_OZ; localStorage.setItem(waterOzKey, String(oz)); return oz; }
      return 0;
    } catch { return 0; }
  });
  const [customOz, setCustomOz] = useState("");

  const setWaterOzPersist = (n: number) => {
    const val = Math.max(0, n);
    setWaterOz(val);
    try { localStorage.setItem(waterOzKey, String(val)); } catch { /* storage full */ }
  };

  const glasses = Math.min(WATER_GOAL, Math.floor(waterOz / GLASS_OZ));

  const [activeFolderId, setActiveFolderId] = useState<number | "all" | "unsorted">("all");
  const [newFolderName, setNewFolderName] = useState("");
  const [history, setHistory] = useState<Recipe[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExhausted, setHistoryExhausted] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedHistoryRecipe, setSelectedHistoryRecipe] = useState<Recipe | null>(null);

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
      <TopBar title="Nutrition" subtitle="Track meals, hydration & this week's recipe" icon={ChefHat} iconColor="#0191CE" showBack />
      <SectionIntroModal sectionKey="nutrition" />
      <div className="px-4 pt-4 flex flex-col gap-4">

        {/* Energy In — daily macro summary */}
        {todaysMeals.length > 0 && (
          <div className="glass-card rounded-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-3">Energy In Today</p>
            <div className="flex items-end gap-2 mb-3">
              <p className="text-3xl font-extrabold text-brand-light leading-none">
                {Math.round(todaysMealTotals.calories).toLocaleString()}
              </p>
              <p className="text-sm text-text-muted mb-0.5">kcal from {todaysMeals.length} meal{todaysMeals.length !== 1 ? "s" : ""}</p>
            </div>
            {hasTrackedNutrition && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Protein", val: todaysMealTotals.protein, color: "#5ba3f5" },
                  { label: "Carbs",   val: todaysMealTotals.carbs,   color: "#5ba3f5" },
                  { label: "Fat",     val: todaysMealTotals.fat,     color: "#5ba3f5" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="rounded-card px-3 py-2.5 text-center" style={{ background: `${color}12`, border: `0.5px solid ${color}30` }}>
                    <p className="text-base font-extrabold" style={{ color }}>{Math.round(val)}g</p>
                    <p className="text-[10px] text-text-dim mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Water Tracker */}
        <div className="glass-card rounded-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-0.5">Hydration</p>
              <p className="text-sm font-bold text-text">
                {Math.round(waterOz)} / {WATER_GOAL_OZ} oz
                {waterOz >= WATER_GOAL_OZ && (
                  <span className="ml-2 text-[11px] font-semibold text-blue-400">Goal reached!</span>
                )}
              </p>
              <p className="text-[11px] text-text-dim mt-0.5">{glasses} of {WATER_GOAL} glasses</p>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center border"
              style={{ background: "rgba(96,165,250,0.12)", borderColor: "rgba(96,165,250,0.25)" }}
            >
              <Droplets size={18} className="text-blue-400" />
            </div>
          </div>

          {/* Glass row — tap to fill/unfill */}
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {Array.from({ length: WATER_GOAL }, (_, i) => {
              const filled = i < glasses;
              return (
                <button
                  key={i}
                  onClick={() => setWaterOzPersist(filled ? i * GLASS_OZ : (i + 1) * GLASS_OZ)}
                  aria-label={filled ? `Remove glass ${i + 1}` : `Add glass ${i + 1}`}
                  className="transition-transform active:scale-90"
                >
                  <Droplets
                    size={28}
                    strokeWidth={1.8}
                    className="transition-colors duration-200"
                    style={{ color: filled ? "#60a5fa" : undefined }}
                    fill={filled ? "rgba(96,165,250,0.28)" : "none"}
                  />
                </button>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-surface-2 border border-border overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (waterOz / WATER_GOAL_OZ) * 100)}%`,
                background: waterOz >= WATER_GOAL_OZ
                  ? "linear-gradient(90deg, #60a5fa, #34d399)"
                  : "linear-gradient(90deg, #60a5fa, #93c5fd)",
              }}
            />
          </div>

          {/* Quick-add oz chips */}
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {[4, 8, 12, 16, 20].map((oz) => (
              <button
                key={oz}
                onClick={() => setWaterOzPersist(waterOz + oz)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-pill border border-blue-400/30 text-blue-400 bg-blue-400/8 active:scale-95 transition-transform"
              >
                +{oz} oz
              </button>
            ))}
          </div>

          {/* Custom oz input */}
          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              min="0"
              max="500"
              value={customOz}
              onChange={(e) => setCustomOz(e.target.value)}
              placeholder="Custom oz"
              className="w-24 text-sm text-center bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-text placeholder:text-text-dim"
            />
            <button
              onClick={() => {
                const oz = parseFloat(customOz);
                if (oz > 0) { setWaterOzPersist(waterOz + oz); setCustomOz(""); }
              }}
              disabled={!customOz || parseFloat(customOz) <= 0}
              className="flex-1 text-sm font-semibold text-blue-400 border border-blue-400/30 rounded-lg py-1.5 disabled:opacity-30 transition-opacity"
            >
              + Add
            </button>
          </div>

          {/* Glass controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWaterOzPersist(Math.max(0, waterOz - GLASS_OZ))}
              disabled={waterOz === 0}
              className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center text-text-muted disabled:opacity-30 transition-opacity"
              aria-label="Remove one glass"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={() => setWaterOzPersist(waterOz + GLASS_OZ)}
              className="flex-1 flex items-center justify-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill py-2 transition-opacity"
              aria-label="Add one glass"
            >
              <Plus size={14} />
              Log a Glass (8 oz)
            </button>
          </div>

          {waterOz > 0 && waterOz < WATER_GOAL_OZ && (
            <p className="text-[11px] text-text-dim text-center mt-2">
              {Math.round(WATER_GOAL_OZ - waterOz)} oz to go — you've got this!
            </p>
          )}
          {waterOz >= WATER_GOAL_OZ && (
            <p className="text-[11px] text-blue-400 text-center mt-2 font-semibold">
              Well done — you stayed hydrated today!
            </p>
          )}
        </div>

        {/* Daily Meal Log */}
        <div ref={mealFormRef} className="glass-card rounded-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-0.5">Food Log</p>
              <p className="text-sm font-bold text-text">
                Log what you ate <span className="text-text-muted font-normal">· 10 pts per meal</span>
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center border"
              style={{ background: "rgba(1,145,206,0.12)", borderColor: "rgba(1,145,206,0.25)" }}
            >
              <Salad size={18} className="text-brand-light" />
            </div>
          </div>
          {/* Hidden file input for photo scan */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoScan}
          />
          <div className="flex gap-2 mb-3">
            <button
              onClick={handleBarcodeScan}
              disabled={scanning}
              className="flex-1 flex items-center justify-center gap-2 bg-surface-2 border border-border text-text-muted text-sm font-semibold rounded-pill py-2.5"
              title="Scan barcode"
            >
              <ScanLine size={16} />
              {scanning ? "Scanning…" : "Barcode"}
            </button>
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={photoScanning}
              className="flex-1 flex items-center justify-center gap-2 bg-surface-2 border border-border text-text-muted text-sm font-semibold rounded-pill py-2.5"
              title="Scan food photo"
            >
              <Camera size={16} />
              {photoScanning ? "Scanning…" : "Scan Photo"}
            </button>
            <button
              onClick={() => (showMealForm ? resetMealForm() : setShowMealForm(true))}
              className="flex-1 flex items-center justify-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill py-2.5"
            >
              <Plus size={16} />
              Log Meal
            </button>
          </div>
          {scanError && (
            <p className="text-xs text-red-400 bg-red-400/10 rounded-card px-3 py-2 mb-2">{scanError}</p>
          )}
          {photoScanError && (
            <p className="text-xs text-red-400 bg-red-400/10 rounded-card px-3 py-2 mb-2">{photoScanError}</p>
          )}

          {showMealForm && (
            <div className="flex flex-col gap-3 border-t border-border pt-3 mb-3">
              {/* Meal type selector */}
              <div className="flex gap-2 flex-wrap">
                {MEAL_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setMealType(t)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-pill border ${
                      mealType === t ? "gradient-brand text-white border-transparent" : "border-border text-text-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* What was eaten */}
              <input
                value={mealNotes}
                onChange={(e) => setMealNotes(e.target.value)}
                placeholder="What did you eat? (e.g. grilled chicken, rice, salad)"
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
              />

              {/* Wellness questions — compact tappable chips */}
              <div>
                <p className="text-[11px] font-semibold text-text-dim uppercase tracking-wide mb-2">What did you purposefully include today?</p>
                <div className="flex flex-wrap gap-2">
                  {([
                      { key: "protein",     Icon: Dumbbell, text: "Protein",     val: hadProtein,    set: setHadProtein },
                      { key: "vegetable",   Icon: Leaf,     text: "Vegetables",  val: hadVegetable,  set: setHadVegetable },
                      { key: "water",       Icon: Droplets, text: "Water",       val: hadWater,      set: setHadWater },
                      { key: "fruit",       Icon: Apple,    text: "Fruit",       val: hadFruit,      set: setHadFruit },
                      { key: "whole_foods", Icon: Wheat,    text: "Whole foods", val: hadWholeFoods, set: setHadWholeFoods },
                    ]).map(({ key, Icon, text, val, set }) => (
                    <button
                      key={key}
                      onClick={() => set(!val)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-pill border ${
                        val ? "gradient-brand text-white border-transparent" : "bg-surface-2 text-text-muted border-border"
                      }`}
                    >
                      <Icon size={13} className="shrink-0" />
                      {text}
                      {val && <span className="text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calorie estimator — add one food item at a time, USDA-backed lookup fills in the rest */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold text-text-dim uppercase tracking-wide">Calorie & Nutrition Estimate <span className="normal-case font-normal text-text-dim">(optional)</span></p>

                {savedMeals.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-semibold text-text-dim uppercase tracking-wide">Quick add saved meal</p>
                    <div className="flex flex-wrap gap-1.5">
                      {savedMeals.map((meal) => (
                        <div
                          key={meal.id}
                          className="flex items-center gap-1 bg-surface-2 border border-border rounded-pill pl-3 pr-1 py-1"
                        >
                          <button
                            onClick={() => handleLoadSavedMeal(meal)}
                            className="text-xs font-semibold text-text"
                          >
                            {meal.name}
                          </button>
                          <button
                            onClick={() => handleDeleteSavedMeal(meal.id)}
                            className="w-5 h-5 flex items-center justify-center rounded-full text-text-dim"
                            aria-label={`Remove saved meal ${meal.name}`}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    value={mealItemInput}
                    onChange={(e) => { setMealItemInput(e.target.value); setEstimateError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddMealItem())}
                    placeholder="e.g. 2 eggs, 3oz ham, orange juice"
                    className="flex-1 bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
                  />
                  <button
                    onClick={handleAddMealItem}
                    disabled={!mealItemInput.trim() || estimating}
                    className="flex items-center gap-1.5 gradient-brand text-white text-xs font-bold rounded-pill px-3.5 shrink-0 disabled:opacity-40"
                  >
                    <Wand2 size={13} />
                    {estimating ? "…" : "Add"}
                  </button>
                </div>
                <p className="text-[10px] text-text-dim">
                  List everything at once with amounts (2 servings, 10oz, 1 cup…) — each food becomes its own line you can adjust.
                </p>

                {estimateError && <p className="text-[11px] text-red-400">{estimateError}</p>}

                {mealItems.length > 0 && (
                  <div className="bg-surface-2 border border-border rounded-card p-3 flex flex-col gap-2">
                    {mealItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text truncate">{item.description}</p>
                          <p className="text-[10px] text-text-dim">
                            {Math.round(item.calories * item.servings)} kcal · {Math.round(item.protein * item.servings)}g protein ·{" "}
                            {Math.round(item.carbs * item.servings)}g carbs · {Math.round(item.fat * item.servings)}g fat
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => updateMealItemServings(i, -1)}
                            disabled={item.servings <= 0.25}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-surface border border-border text-text-dim disabled:opacity-30"
                            aria-label="Fewer servings"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="text-xs font-semibold text-text w-8 text-center" title="Servings">
                            {formatServings(item.servings)}
                          </span>
                          <button
                            onClick={() => updateMealItemServings(i, 1)}
                            disabled={item.servings >= 20}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-surface border border-border text-text-dim disabled:opacity-30"
                            aria-label="More servings"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeMealItem(i)}
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-surface border border-border text-text-dim shrink-0"
                          aria-label="Remove item"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}

                    <div className="grid grid-cols-4 gap-2 text-center border-t border-border pt-2 mt-1">
                      <CalorieStat kcal={totalEstimated.calories} label="Calories" />
                      <GramStat grams={totalEstimated.protein} label="Protein" />
                      <GramStat grams={totalEstimated.carbs} label="Carbs" />
                      <GramStat grams={totalEstimated.fat} label="Fat" />
                    </div>
                    <p className="text-[10px] text-text-dim text-center">
                      {allVerified ? "Matched against the USDA nutrition database" : "Estimated — for more accurate results, enter food items manually using the field below"}
                    </p>
                  </div>
                )}

                {mealItems.length === 0 && (
                  <input
                    type="number"
                    value={estimatedCalories}
                    onChange={(e) => setEstimatedCalories(e.target.value)}
                    placeholder="Or enter total calories manually"
                    min={0}
                    max={5000}
                    className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
                  />
                )}

                {(mealItems.length > 0 || estimatedCalories) && (
                  showSaveMealPrompt ? (
                    <div className="flex gap-2">
                      <input
                        value={saveMealName}
                        onChange={(e) => setSaveMealName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSaveMeal())}
                        placeholder="Name this meal (e.g. My usual breakfast)"
                        className="flex-1 bg-surface-2 border border-border rounded-card px-3 py-2 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveMeal}
                        disabled={!saveMealName.trim() || savingSavedMeal}
                        className="flex items-center gap-1 gradient-brand text-white text-xs font-semibold rounded-pill px-3 disabled:opacity-40"
                      >
                        {savingSavedMeal ? "…" : "Save"}
                      </button>
                      <button
                        onClick={() => { setShowSaveMealPrompt(false); setSaveMealName(""); }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-dim shrink-0"
                        aria-label="Cancel"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSaveMealPrompt(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-brand-light self-start"
                    >
                      <Bookmark size={13} />
                      Save this meal for quick reuse
                    </button>
                  )
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleLogMeal}
                  disabled={savingMeal}
                  className="flex-1 gradient-brand text-white text-xs font-semibold rounded-pill py-2.5 disabled:opacity-50"
                >
                  {savingMeal ? "Saving…" : editingMealId != null ? "Update Meal" : "Save Meal (+10 pts)"}
                </button>
                <button
                  onClick={resetMealForm}
                  className="flex-1 bg-surface-2 border border-border text-text-muted text-xs font-semibold rounded-pill py-2.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {todaysMeals.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-2">No meals logged today yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {todaysMeals.map((meal) => {
                const checks = [
                  meal.had_protein && "Protein",
                  meal.had_vegetable && "Vegetable",
                  meal.had_water && "Water",
                  meal.had_fruit && "Fruit",
                  meal.had_whole_foods && "Whole foods",
                ].filter(Boolean);
                const ms = MEAL_TYPE_STYLE[meal.meal_type] ?? MEAL_TYPE_STYLE.Snack;
                return (
                  <div key={meal.id} className="rounded-card p-3 flex items-start gap-3 transition-colors"
                    style={{ background: ms.bg, border: `0.5px solid ${ms.border}` }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: ms.border, color: ms.accent }}>
                          {meal.meal_type}
                        </span>
                        {meal.notes && (
                          <span className="text-xs text-text font-medium truncate flex-1 min-w-0">{meal.notes}</span>
                        )}
                        <span className="text-[10px] text-text-dim shrink-0 ml-auto">
                          {new Date(meal.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {meal.estimated_calories != null && (
                        <div className="flex items-end gap-1.5 mb-1">
                          <p className="text-2xl font-extrabold leading-none text-brand-light">
                            {meal.estimated_calories}
                          </p>
                          <p className="text-xs text-text-muted mb-0.5">kcal</p>
                        </div>
                      )}
                      {checks.length > 0 && (
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mb-1">
                          {(checks as string[]).map((c) => (
                            <span key={c} className="text-[10px] font-semibold" style={{ color: ms.accent }}>{c}</span>
                          ))}
                        </div>
                      )}
                      {(meal.estimated_protein_g != null || meal.estimated_carbs_g != null || meal.estimated_fat_g != null) && (
                        <div className="flex gap-3">
                          {meal.estimated_protein_g != null && <span className="text-[10px] text-text-dim">P <span className="text-text font-semibold">{Math.round(Number(meal.estimated_protein_g))}g</span></span>}
                          {meal.estimated_carbs_g != null && <span className="text-[10px] text-text-dim">C <span className="text-text font-semibold">{Math.round(Number(meal.estimated_carbs_g))}g</span></span>}
                          {meal.estimated_fat_g != null && <span className="text-[10px] text-text-dim">F <span className="text-text font-semibold">{Math.round(Number(meal.estimated_fat_g))}g</span></span>}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0 mt-0.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditMeal(meal)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-pill bg-surface border border-border text-text-dim hover:text-text hover:border-brand-light/50 transition-colors text-[11px] font-semibold"
                          title="Edit this meal"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMeal(meal.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-surface border border-border text-red-400/70 hover:text-red-400 hover:border-red-400/50 transition-colors"
                          aria-label="Delete meal"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        <a
          href="/nutrition/meal-plan"
          className="flex items-center justify-center gap-1.5 gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 shadow-glow"
        >
          <Calendar size={15} />
          Plan This Week's Meals
        </a>

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


        {historyOpen && selectedHistoryRecipe && (
          <div className="glass-card rounded-card overflow-hidden">
            <img
              src={selectedHistoryRecipe.image}
              alt={selectedHistoryRecipe.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <button
                onClick={() => setSelectedHistoryRecipe(null)}
                className="flex items-center gap-1.5 text-xs font-semibold text-text-muted mb-3"
              >
                <ArrowLeft size={14} />
                Back to Past Recipes
              </button>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-text-dim">{selectedHistoryRecipe.date}</p>
              </div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-text flex-1">{selectedHistoryRecipe.name}</h2>
                <button
                  onClick={() => toggleRecipeSave(selectedHistoryRecipe)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-text-muted"
                >
                  <Bookmark
                    size={16}
                    className={
                      savedRecipes.some(
                        (r) => r.name === selectedHistoryRecipe.name && r.date === selectedHistoryRecipe.date
                      )
                        ? "fill-brand-light text-brand-light"
                        : ""
                    }
                  />
                  {savedRecipes.some(
                    (r) => r.name === selectedHistoryRecipe.name && r.date === selectedHistoryRecipe.date
                  )
                    ? "Saved"
                    : "Save"}
                </button>
              </div>
              <p className="text-sm text-text-muted leading-relaxed mb-4">{selectedHistoryRecipe.description}</p>

              {selectedHistoryRecipe.nutrition && (
                <NutritionInfo
                  nutrition={selectedHistoryRecipe.nutrition}
                  verified={selectedHistoryRecipe.nutritionVerified}
                />
              )}

              <h3 className="text-sm font-bold text-text mb-2">Ingredients</h3>
              <ul className="flex flex-col gap-1.5 mb-4">
                {selectedHistoryRecipe.ingredients.map((ingredient) => (
                  <li key={ingredient} className="flex items-start gap-2 text-sm text-text-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-light mt-1.5 shrink-0" />
                    {ingredient}
                  </li>
                ))}
              </ul>

              <h3 className="text-sm font-bold text-text mb-2">Steps</h3>
              <ol className="flex flex-col gap-2">
                {selectedHistoryRecipe.steps.map((step, index) => (
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
        )}

        {historyOpen && !selectedHistoryRecipe && (
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
                  <div
                    key={`${recipe.date}-${recipe.name}`}
                    className="flex items-center gap-3 border-b border-border pb-3 last:border-none last:pb-0"
                  >
                    <button
                      onClick={() => setSelectedHistoryRecipe(recipe)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <img src={recipe.image} alt={recipe.name} className="w-14 h-14 rounded-card object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-dim">{recipe.date}</p>
                        <h4 className="text-sm font-semibold text-text truncate">{recipe.name}</h4>
                      </div>
                    </button>
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
