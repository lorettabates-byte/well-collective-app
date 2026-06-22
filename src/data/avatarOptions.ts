// On-brand cartoon avatar options for the profile picker, replacing real-person
// stock photos. Each is a hand-built flat-style SVG using the WELL brand palette
// (brand-dark/brand-blue/brand-light) plus a few warm neutrals for variety,
// rendered as a data URI so no external image hosting is needed.

interface AvatarSpec {
  bg: string;
  skin: string;
  hair: string;
  hairPath: string;
  accessory?: string;
}

const SPECS: AvatarSpec[] = [
  // Short wavy bob, brand-dark background
  {
    bg: "#01519D",
    skin: "#F2C9A0",
    hair: "#3B2415",
    hairPath: "M30 46c0-22 14-34 32-34s32 12 32 34c0-6-4-9-8-9-2-10-10-16-24-16s-22 6-24 16c-4 0-8 3-8 9z",
  },
  // Curly afro, brand-blue background
  {
    bg: "#0191CE",
    skin: "#8D5524",
    hair: "#1A1108",
    hairPath:
      "M62 18a18 18 0 1 0-24 4 16 16 0 1 0-10 24 17 17 0 1 0 28 8 16 16 0 1 0 14-26 18 18 0 1 0-8-10z",
  },
  // Sleek high bun, brand-light background
  {
    bg: "#84D8FD",
    skin: "#F2C9A0",
    hair: "#2B1B12",
    hairPath: "M34 44c0-18 12-28 28-28s28 10 28 28c-3-5-7-7-12-7-3-8-9-13-16-13s-13 5-16 13c-5 0-9 2-12 7z",
    accessory: "bun",
  },
  // Long straight hair with center part, warm coral background
  {
    bg: "#E8866B",
    skin: "#FFDBB5",
    hair: "#5A3825",
    hairPath: "M30 70V44c0-20 13-32 32-32s32 12 32 32v26c-4 0-6-10-6-18 0-14-8-23-26-23s-26 9-26 23c0 8-2 18-6 18z",
  },
  // Pixie cut, sage green background
  {
    bg: "#5E8C72",
    skin: "#C68642",
    hair: "#0F0B08",
    hairPath: "M32 40c0-18 12-30 30-30s30 12 30 30c-2-4-6-6-9-6-4-9-12-15-21-15s-17 6-21 15c-3 0-7 2-9 6z",
  },
  // Side-swept bangs + headband, golden background
  {
    bg: "#D6A93B",
    skin: "#F2C9A0",
    hair: "#7A4A21",
    hairPath: "M30 48c0-20 13-32 32-32s32 12 32 32c-2-6-6-9-9-9-12 4-44 4-46 0-3 0-7 3-9 9z",
    accessory: "headband",
  },
  // Locs pulled back, brand-dark background
  {
    bg: "#01519D",
    skin: "#5C3A21",
    hair: "#1A1108",
    hairPath: "M30 50c0-20 13-34 32-34s32 14 32 34c-2-2-4-3-6-3 0-14-11-24-26-24s-26 10-26 24c-2 0-4 1-6 3z",
  },
  // Short tapered fade, deep plum background
  {
    bg: "#6B4D6E",
    skin: "#8D5524",
    hair: "#0C0A09",
    hairPath: "M34 38c0-16 11-26 28-26s28 10 28 26c-2-3-5-4-7-4-3-7-10-12-21-12s-18 5-21 12c-2 0-5 1-7 4z",
  },
  // Twin buns, brand-light background
  {
    bg: "#84D8FD",
    skin: "#FFDBB5",
    hair: "#3B2415",
    hairPath: "M34 42c0-18 11-28 28-28s28 10 28 28c-3-4-6-6-10-6-3-8-9-13-18-13s-15 5-18 13c-4 0-7 2-10 6z",
    accessory: "twin-buns",
  },
  // Glasses + neat crop, terracotta background
  {
    bg: "#C56B4A",
    skin: "#F2C9A0",
    hair: "#2B1B12",
    hairPath: "M32 40c0-17 12-28 30-28s30 11 30 28c-2-4-5-6-8-6-4-8-12-13-22-13s-18 5-22 13c-3 0-6 2-8 6z",
    accessory: "glasses",
  },
  // Loose waves with flower clip, blush background
  {
    bg: "#D98EA3",
    skin: "#8D5524",
    hair: "#1A1108",
    hairPath: "M30 64c0-2 6-6 6-20 0-18 12-30 28-30s28 12 28 30c0 14 6 18 6 20-4 0-6-8-6-16 0-12-10-20-28-20s-28 8-28 20c0 8-2 16-6 16z",
    accessory: "flower",
  },
  // Shaved sides + top knot, slate background
  {
    bg: "#4A6B7A",
    skin: "#C68642",
    hair: "#0F0B08",
    hairPath: "M40 38c0-14 9-22 22-22s22 8 22 22c-8-6-36-6-44 0z",
    accessory: "topknot",
  },
];

function accessorySvg(accessory: string | undefined, cx: number): string {
  switch (accessory) {
    case "bun":
      return `<circle cx="${cx}" cy="20" r="9" fill="#2B1B12" />`;
    case "topknot":
      return `<circle cx="${cx}" cy="14" r="8" fill="#0F0B08" />`;
    case "twin-buns":
      return `<circle cx="${cx - 26}" cy="26" r="7" fill="#3B2415" /><circle cx="${cx + 26}" cy="26" r="7" fill="#3B2415" />`;
    case "headband":
      return `<rect x="26" y="36" width="${cx * 2 - 52}" height="6" rx="3" fill="#F3F8FC" />`;
    case "glasses":
      return `<g fill="none" stroke="#1F3349" stroke-width="3"><circle cx="${cx - 12}" cy="50" r="9" /><circle cx="${cx + 12}" cy="50" r="9" /><line x1="${cx - 3}" y1="50" x2="${cx + 3}" y2="50" /></g>`;
    case "flower":
      return `<g transform="translate(${cx + 20}, 30)"><circle r="3" fill="#F3F8FC" /><circle cx="-4" cy="-3" r="3" fill="#D98EA3" /><circle cx="4" cy="-3" r="3" fill="#D98EA3" /><circle cx="-4" cy="3" r="3" fill="#D98EA3" /><circle cx="4" cy="3" r="3" fill="#D98EA3" /></g>`;
    default:
      return "";
  }
}

function buildAvatarSvg(spec: AvatarSpec): string {
  const cx = 48;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
    <circle cx="48" cy="48" r="48" fill="${spec.bg}" />
    <circle cx="48" cy="54" r="26" fill="${spec.skin}" />
    <path d="${spec.hairPath}" fill="${spec.hair}" />
    <circle cx="39" cy="54" r="2.6" fill="#1F1208" />
    <circle cx="57" cy="54" r="2.6" fill="#1F1208" />
    <path d="M38 64q10 8 20 0" stroke="#7A3B22" stroke-width="2.5" fill="none" stroke-linecap="round" />
    ${accessorySvg(spec.accessory, cx)}
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const AVATAR_OPTIONS: string[] = SPECS.map(buildAvatarSvg);
