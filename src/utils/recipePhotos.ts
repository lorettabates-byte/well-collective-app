const PHOTOS: Record<string, string[]> = {
  salad: [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=70",
  ],
  grain_bowl: [
    "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=900&q=70",
  ],
  smoothie: [
    "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?auto=format&fit=crop&w=900&q=70",
  ],
  soup: [
    "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1588566565463-180a5b2090d2?auto=format&fit=crop&w=900&q=70",
  ],
  pasta: [
    "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=900&q=70",
  ],
  chicken: [
    "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=70",
  ],
  fish: [
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?auto=format&fit=crop&w=900&q=70",
  ],
  oatmeal: [
    "https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1495214783159-3503fd1b572d?auto=format&fit=crop&w=900&q=70",
  ],
  toast: [
    "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=70",
  ],
  wrap: [
    "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1551326844-4df70f78d0e9?auto=format&fit=crop&w=900&q=70",
  ],
  rice: [
    "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=900&q=70",
  ],
  stir_fry: [
    "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=70",
  ],
  roasted_vegetables: [
    "https://images.unsplash.com/photo-1636743716922-1884c23fb6f6?auto=format&fit=crop&w=900&q=70",
  ],
  curry: [
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=900&q=70",
  ],
  tacos: [
    "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=900&q=70",
  ],
  sandwich: [
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=900&q=70",
  ],
  fruit: [
    "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=900&q=70",
  ],
  baked: [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=70",
  ],
  dessert: [
    "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=70",
  ],
  general_healthy: [
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=70",
    "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=70",
  ],
};

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getRecipePhotoByCategory(category: string, recipeName: string): string {
  const photos = PHOTOS[category] || PHOTOS.general_healthy;
  return photos[hashCode(recipeName) % photos.length];
}

export function getRecipePhoto(name: string, ingredients: string[]): string {
  const text = `${name} ${ingredients.join(" ")}`.toLowerCase();

  const matchers: [string[], string][] = [
    [["porridge", "oatmeal", "oats", "granola", "muesli", "overnight oats"], "oatmeal"],
    [["smoothie", "shake", "blend", "juice", "acai"], "smoothie"],
    [["salad", "slaw", "greens", "arugula", "kale salad", "lettuce"], "salad"],
    [["soup", "broth", "stew", "chili", "chowder", "bisque", "gazpacho"], "soup"],
    [["curry", "tikka", "masala", "dal", "lentil"], "curry"],
    [["pasta", "noodle", "spaghetti", "penne", "linguine", "fettuccine", "ziti", "macaroni"], "pasta"],
    [["stir fry", "stir-fry", "wok", "teriyaki", "sesame", "asian"], "stir_fry"],
    [["taco", "burrito", "enchilada", "fajita", "quesadilla", "mexican"], "tacos"],
    [["salmon", "fish", "tuna", "shrimp", "seafood", "cod", "tilapia", "mahi"], "fish"],
    [["chicken", "turkey", "poultry", "hen"], "chicken"],
    [["toast", "avocado toast", "bruschetta", "crostini"], "toast"],
    [["wrap", "roll-up", "roll up", "spring roll", "lettuce wrap"], "wrap"],
    [["sandwich", "panini", "club", "sub", "melt"], "sandwich"],
    [["rice", "risotto", "pilaf", "fried rice", "quinoa", "grain bowl", "buddha bowl", "power bowl"], "grain_bowl"],
    [["roast", "roasted", "baked vegeta", "sheet pan"], "roasted_vegetables"],
    [["cake", "cookie", "brownie", "dessert", "sweet", "chocolate", "parfait", "pudding", "mousse"], "dessert"],
    [["fruit", "berry", "melon", "citrus", "tropical"], "fruit"],
    [["muffin", "scone", "bread", "baked", "banana bread"], "baked"],
    [["egg", "omelet", "omelette", "frittata", "scramble", "breakfast"], "toast"],
  ];

  for (const [keywords, category] of matchers) {
    if (keywords.some((kw) => text.includes(kw))) {
      const photos = PHOTOS[category];
      return photos[hashCode(name) % photos.length];
    }
  }

  const photos = PHOTOS.general_healthy;
  return photos[hashCode(name) % photos.length];
}
