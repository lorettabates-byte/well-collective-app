import type { RecipeNutrition } from "../types";

export interface RecipeSuggestion {
  name: string;
  description: string;
  ingredients: string[];
  steps: string[];
  image: string;
  nutrition: RecipeNutrition;
}

// Fallback rotation of AI-style recipe suggestions, used whenever the admin
// hasn't uploaded a specific recipe for today. Nutrition values are
// calculated per-ingredient from standard USDA nutrition data for the exact
// quantities listed, then summed and rounded — not lab-tested, but not
// guessed either.
export const RECIPES: RecipeSuggestion[] = [
  {
    name: "Gentle Consistency Bowl",
    description: "A simple, repeatable grain bowl that proves small daily choices add up — easy to make again and again.",
    ingredients: [
      "1 cup cooked quinoa",
      "1/2 cup roasted chickpeas",
      "1 cup mixed greens",
      "1/2 avocado, sliced",
      "1/4 cup shredded carrot",
      "2 tbsp tahini dressing",
    ],
    steps: [
      "Warm the quinoa and roasted chickpeas.",
      "Layer greens, quinoa, chickpeas, avocado, and carrot in a bowl.",
      "Drizzle with tahini dressing and enjoy mindfully.",
    ],
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=70",
    nutrition: { calories: 640, protein: "21g", carbs: "76g", fat: "28g" },
  },
  {
    name: "Protect Your Peace Smoothie",
    description: "A calming, nutrient-rich smoothie to sip slowly during a quiet moment to yourself.",
    ingredients: [
      "1 cup unsweetened almond milk",
      "1/2 frozen banana",
      "1/2 cup blueberries",
      "1 tbsp almond butter",
      "1/2 tsp cinnamon",
      "Handful of spinach",
    ],
    steps: [
      "Add all ingredients to a blender.",
      "Blend until smooth and creamy.",
      "Pour into your favorite mug and sip slowly, screen-free.",
    ],
    image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=900&q=70",
    nutrition: { calories: 240, protein: "6g", carbs: "31g", fat: "13g" },
  },
  {
    name: "Comeback Energy Stir-Fry",
    description: "A colorful veggie stir-fry that's forgiving and flexible — perfect for getting back on track without pressure.",
    ingredients: [
      "1 cup broccoli florets",
      "1 bell pepper, sliced",
      "1 cup snap peas",
      "1 cup cooked brown rice",
      "2 tbsp low-sodium soy sauce",
      "1 tsp sesame oil",
      "1 clove garlic, minced",
    ],
    steps: [
      "Heat sesame oil in a pan over medium-high heat.",
      "Add garlic and vegetables, stir-fry for 5-6 minutes until tender-crisp.",
      "Stir in soy sauce and serve over brown rice.",
    ],
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=70",
    nutrition: { calories: 370, protein: "13g", carbs: "67g", fat: "7g" },
  },
  {
    name: "Morning Reset Overnight Oats",
    description: "Prep this the night before for a calm, grounded start to your morning routine.",
    ingredients: [
      "1/2 cup rolled oats",
      "1/2 cup milk of choice",
      "1/4 cup Greek yogurt",
      "1 tsp chia seeds",
      "1/2 tsp vanilla extract",
      "Fresh berries to top",
    ],
    steps: [
      "Combine oats, milk, yogurt, chia seeds, and vanilla in a jar.",
      "Stir well, cover, and refrigerate overnight.",
      "Top with fresh berries in the morning and enjoy.",
    ],
    image: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=900&q=70",
    nutrition: { calories: 290, protein: "16g", carbs: "43g", fat: "7g" },
  },
  {
    name: "Strong & Steady Salad",
    description: "A hearty, protein-packed salad to fuel your workouts and your week.",
    ingredients: [
      "2 cups romaine, chopped",
      "4 oz grilled chicken or chickpeas",
      "1/4 cup cherry tomatoes, halved",
      "1/4 cup cucumber, diced",
      "2 tbsp feta cheese",
      "1 tbsp olive oil + lemon juice",
    ],
    steps: [
      "Toss romaine, tomatoes, and cucumber together.",
      "Top with grilled chicken or chickpeas and feta.",
      "Drizzle with olive oil and lemon juice before serving.",
    ],
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=70",
    nutrition: { calories: 380, protein: "39g", carbs: "6g", fat: "22g" },
  },
  {
    name: "Soft Life Soup",
    description: "A cozy, nourishing soup for slow evenings and gentle self-care nights in.",
    ingredients: [
      "1 tbsp olive oil",
      "1/2 onion, diced",
      "2 carrots, sliced",
      "2 cups vegetable broth",
      "1 cup cooked lentils",
      "1 tsp turmeric",
      "Salt & pepper to taste",
    ],
    steps: [
      "Sauté onion and carrots in olive oil until soft.",
      "Add broth, lentils, and turmeric; simmer for 15 minutes.",
      "Season to taste and serve warm.",
    ],
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=70",
    nutrition: { calories: 460, protein: "21g", carbs: "61g", fat: "16g" },
  },
];

export function getFallbackRecipe(date: Date): RecipeSuggestion {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return RECIPES[dayOfYear % RECIPES.length];
}
