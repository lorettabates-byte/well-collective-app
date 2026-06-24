// Generate SVG food illustrations for recipes based on name and ingredients
// Creates unique, colorful, wellness-themed food visuals

type FoodCategory = "salad" | "bowl" | "smoothie" | "pasta" | "soup" | "grain" | "wrap" | "plate";

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function detectFoodCategory(recipeName: string, ingredients: string[]): FoodCategory {
  const name = recipeName.toLowerCase();
  const ingredientStr = ingredients.join(" ").toLowerCase();

  if (name.includes("salad") || ingredientStr.includes("lettuce") || ingredientStr.includes("kale"))
    return "salad";
  if (name.includes("bowl") || ingredientStr.includes("rice") || ingredientStr.includes("grain"))
    return "bowl";
  if (name.includes("smoothie") || name.includes("blend") || ingredientStr.includes("berries"))
    return "smoothie";
  if (name.includes("pasta") || ingredientStr.includes("pasta") || ingredientStr.includes("noodle"))
    return "pasta";
  if (name.includes("soup") || name.includes("broth") || ingredientStr.includes("soup"))
    return "soup";
  if (name.includes("toast") || name.includes("bread") || ingredientStr.includes("grain"))
    return "grain";
  if (name.includes("wrap") || name.includes("roll")) return "wrap";
  return "plate";
}

function generateColorPalette(hash: number): string[] {
  const palettes = [
    ["#FF6B6B", "#FFE66D", "#95E1D3"], // Red, Yellow, Mint
    ["#6BCF7F", "#FFD166", "#EF476F"], // Green, Gold, Pink
    ["#FF9E64", "#7DCFFF", "#9ECE6A"], // Orange, Blue, Light Green
    ["#E39072", "#A89968", "#6A994E"], // Brown, Tan, Green
    ["#D62828", "#F77F00", "#FCBF49"], // Red-Orange gradient
    ["#2A9D8F", "#E9C46A", "#F4A261"], // Teal, Gold, Orange
    ["#BC4749", "#A8DADC", "#457B9D"], // Burgundy, Light Blue, Blue
  ];
  return palettes[hash % palettes.length];
}

export function generateRecipeImage(recipeName: string, ingredients: string[]): string {
  const hash = hashString(recipeName);
  const category = detectFoodCategory(recipeName, ingredients);
  const colors = generateColorPalette(hash);
  const seed = hash % 100;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F8F9FA;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#E8EEF7;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#grad1)"/>`;

  switch (category) {
    case "salad":
      svg += generateSaladImage(colors, seed);
      break;
    case "bowl":
      svg += generateBowlImage(colors, seed);
      break;
    case "smoothie":
      svg += generateSmoothieImage(colors, seed);
      break;
    case "pasta":
      svg += generatePastaImage(colors, seed);
      break;
    case "soup":
      svg += generateSoupImage(colors, seed);
      break;
    case "grain":
      svg += generateGrainImage(colors, seed);
      break;
    case "wrap":
      svg += generateWrapImage(colors, seed);
      break;
    default:
      svg += generatePlateImage(colors, seed);
  }

  svg += `</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function generateSaladImage(colors: string[], _seed: number): string {
  const leafCount = 3 + (_seed % 4);
  let svg = `<circle cx="200" cy="220" r="90" fill="${colors[0]}" opacity="0.7"/>`;

  for (let i = 0; i < leafCount; i++) {
    const angle = (i / leafCount) * Math.PI * 2;
    const x = 200 + Math.cos(angle) * 60;
    const y = 220 + Math.sin(angle) * 60;
    svg += `<ellipse cx="${x}" cy="${y}" rx="25" ry="35" fill="${colors[i % colors.length]}" opacity="0.8" transform="rotate(${angle * 57.3} ${x} ${y})"/>`;
  }

  svg += `<circle cx="200" cy="200" r="30" fill="${colors[2]}" opacity="0.6"/>`;
  return svg;
}

function generateBowlImage(colors: string[], _seed: number): string {
  let svg = `
    <path d="M 130 200 Q 130 260 200 270 Q 270 260 270 200" fill="${colors[0]}" opacity="0.5" stroke="${colors[0]}" stroke-width="3"/>
    <ellipse cx="200" cy="200" rx="70" ry="30" fill="${colors[1]}" opacity="0.8"/>
    <circle cx="160" cy="210" r="20" fill="${colors[2]}" opacity="0.7"/>
    <circle cx="220" cy="215" r="25" fill="${colors[0]}" opacity="0.7"/>
    <circle cx="190" cy="230" r="18" fill="${colors[2]}" opacity="0.6"/>
  `;
  return svg;
}

function generateSmoothieImage(colors: string[], _seed: number): string {
  let svg = `
    <path d="M 160 150 L 170 280 Q 170 290 180 290 L 220 290 Q 230 290 230 280 L 240 150 Z" fill="white" stroke="${colors[0]}" stroke-width="2"/>
    <rect x="160" y="150" width="80" height="80" fill="${colors[0]}" opacity="0.8"/>
    <rect x="160" y="230" width="80" height="50" fill="${colors[1]}" opacity="0.7"/>
    <circle cx="185" cy="180" r="12" fill="${colors[2]}" opacity="0.6"/>
    <circle cx="210" cy="200" r="10" fill="${colors[2]}" opacity="0.6"/>
    <circle cx="195" cy="250" r="8" fill="white" opacity="0.4"/>
    <rect x="175" y="130" width="50" height="15" fill="${colors[1]}" opacity="0.5" rx="7"/>
  `;
  return svg;
}

function generatePastaImage(colors: string[], _seed: number): string {
  let svg = `
    <circle cx="200" cy="220" r="95" fill="white" stroke="${colors[0]}" stroke-width="2"/>
    <circle cx="200" cy="220" r="85" fill="${colors[0]}" opacity="0.6"/>
  `;

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x1 = 200 + Math.cos(angle) * 40;
    const y1 = 220 + Math.sin(angle) * 40;
    const x2 = 200 + Math.cos(angle) * 70;
    const y2 = 220 + Math.sin(angle) * 70;
    svg += `<path d="M ${x1} ${y1} Q ${(x1 + x2) / 2 + 10} ${(y1 + y2) / 2} ${x2} ${y2}" stroke="${colors[1]}" stroke-width="8" fill="none" opacity="0.8" stroke-linecap="round"/>`;
  }

  svg += `<circle cx="180" cy="200" r="15" fill="${colors[2]}" opacity="0.7"/>`;
  return svg;
}

function generateSoupImage(colors: string[], _seed: number): string {
  let svg = `
    <ellipse cx="200" cy="240" rx="80" ry="50" fill="${colors[0]}" opacity="0.7"/>
    <path d="M 130 200 Q 130 240 200 250 Q 270 240 270 200" fill="white" stroke="${colors[0]}" stroke-width="2"/>
    <ellipse cx="200" cy="200" rx="70" ry="20" fill="${colors[1]}" opacity="0.5"/>
  `;

  for (let i = 0; i < 12; i++) {
    const x = 140 + Math.random() * 120;
    const y = 190 + Math.random() * 40;
    const size = 3 + Math.random() * 4;
    svg += `<circle cx="${x}" cy="${y}" r="${size}" fill="${colors[2]}" opacity="0.6"/>`;
  }

  return svg;
}

function generateGrainImage(colors: string[], _seed: number): string {
  let svg = `
    <rect x="120" y="150" width="160" height="120" fill="${colors[0]}" opacity="0.7" rx="10"/>
    <rect x="130" y="160" width="140" height="100" fill="${colors[1]}" opacity="0.6" rx="8"/>
  `;

  for (let i = 0; i < 20; i++) {
    const x = 130 + Math.random() * 140;
    const y = 160 + Math.random() * 100;
    svg += `<rect x="${x}" y="${y}" width="4" height="8" fill="${colors[2]}" opacity="0.7" transform="rotate(${Math.random() * 360} ${x + 2} ${y + 4})"/>`;
  }

  return svg;
}

function generateWrapImage(colors: string[], _seed: number): string {
  let svg = `
    <g transform="translate(200, 200) rotate(15)">
      <circle cx="0" cy="0" r="85" fill="${colors[0]}" opacity="0.7"/>
      <circle cx="0" cy="0" r="75" fill="${colors[1]}" opacity="0.8"/>
      <circle cx="0" cy="0" r="60" fill="${colors[2]}" opacity="0.6"/>
    </g>
  `;
  return svg;
}

function generatePlateImage(colors: string[], _seed: number): string {
  let svg = `
    <circle cx="200" cy="220" r="100" fill="white" stroke="${colors[0]}" stroke-width="2"/>
    <circle cx="200" cy="220" r="90" fill="${colors[0]}" opacity="0.5"/>
    <circle cx="170" cy="190" r="30" fill="${colors[1]}" opacity="0.7"/>
    <circle cx="230" cy="200" r="25" fill="${colors[2]}" opacity="0.7"/>
    <circle cx="200" cy="240" r="28" fill="${colors[1]}" opacity="0.6"/>
    <circle cx="210" cy="150" r="12" fill="${colors[2]}" opacity="0.5"/>
  `;
  return svg;
}
