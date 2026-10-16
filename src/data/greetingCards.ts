// Typed front door to the approved card art in cardArt.ts: which occasions a
// member can pick, the five designs for each, the cover/inside markup for a
// stored card, and the mapping that keeps cards sent before 2026-10-16 opening.
import {
  CARD_COVER_TITLE,
  CARD_DESIGNS_RAW,
  CARD_FX_FOR,
  CARD_OCCASION_LIST,
  CARD_PRINTED,
  CARD_SAMPLE_NOTES,
  insideLeft,
  photoCover,
  welcomeCover,
} from "./cardArt";
import type { CardDesign, CardFx } from "./cardArt";
import { CARD_OCCASIONS as LEGACY_OCCASIONS } from "./cards";

export type { CardDesign, CardFx };

export const WELCOME_OCCASION = "welcome";
export const PHOTO_DESIGN = "photo";

const DESIGNS = CARD_DESIGNS_RAW as unknown as Record<string, CardDesign[]>;
const OCC = CARD_OCCASION_LIST as unknown as [string, string][];

export interface GreetingOccasion {
  id: string;
  label: string;
}

/** Occasions a member can send. The welcome card is only ever sent by Loretta. */
export const SENDABLE_OCCASIONS: GreetingOccasion[] = OCC
  .filter(([id]) => id !== WELCOME_OCCASION)
  .map(([id, label]) => ({ id, label }));

export function occasionLabel(occasionId: string): string {
  return OCC.find(([id]) => id === occasionId)?.[1] ?? "Card";
}

export function designsFor(occasionId: string): CardDesign[] {
  return DESIGNS[occasionId] ?? [];
}

export function printedLine(occasionId: string): string {
  return (CARD_PRINTED as Record<string, string>)[occasionId] ?? "";
}

/** The sample note from the approved demo, used as a placeholder only. */
export function sampleNote(occasionId: string): string {
  return (CARD_SAMPLE_NOTES as Record<string, string>)[occasionId] ?? "";
}

export const WELCOME_NOTE = (CARD_SAMPLE_NOTES as Record<string, string>).welcome;
export const WELCOME_SIGNATURE = "With love, Loretta";

/** Only show a photo we stored ourselves (a JPEG data URL) or an https image. */
export function safePhoto(src: string | null | undefined): string | null {
  if (!src) return null;
  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src)) return src;
  if (/^https:\/\/[^"'<>\s]+$/.test(src)) return src;
  return null;
}

// Old styles (before the approved designs) map onto the new three per occasion
// by their position in the old list, so a card already sent still opens with a
// face from the same occasion.
const LEGACY_FALLBACK_OCCASION = "just-saying-hi";

export interface ResolvedCard {
  occasionId: string;
  designId: string;
}

export function resolveCard(occasionId: string | null | undefined, designOrStyleId: string | null | undefined, hasPhoto = false): ResolvedCard {
  const occ = occasionId ?? "";
  const id = designOrStyleId ?? "";
  if (occ === WELCOME_OCCASION) return { occasionId: WELCOME_OCCASION, designId: WELCOME_OCCASION };
  const designs = DESIGNS[occ];
  if (designs) {
    if (id === PHOTO_DESIGN && hasPhoto) return { occasionId: occ, designId: PHOTO_DESIGN };
    if (designs.some((d) => d.id === id)) return { occasionId: occ, designId: id };
    const legacy = LEGACY_OCCASIONS.find((o) => o.id === occ);
    const idx = legacy ? Math.max(0, legacy.styles.findIndex((s) => s.id === id)) : 0;
    return { occasionId: occ, designId: designs[idx % designs.length].id };
  }
  // "custom" cards from the old Design a Custom Card screen, or anything unknown.
  return { occasionId: LEGACY_FALLBACK_OCCASION, designId: DESIGNS[LEGACY_FALLBACK_OCCASION][0].id };
}

export function coverHtml(occasionId: string, designId: string, photo?: string | null, thumb = false): string {
  if (occasionId === WELCOME_OCCASION) return welcomeCover();
  const p = safePhoto(photo);
  if (designId === PHOTO_DESIGN && p) return photoCover(p, occasionId, thumb);
  const list = designsFor(occasionId);
  const d = list.find((x) => x.id === designId) ?? list[0];
  return d ? d.draw() : "";
}

export function insideLeftHtml(occasionId: string): string {
  return insideLeft(occasionId);
}

export function fxFor(occasionId: string, designId: string): CardFx[] {
  const fxMap = CARD_FX_FOR as Record<string, CardFx[]>;
  if (occasionId === WELCOME_OCCASION || designId === PHOTO_DESIGN) return fxMap[occasionId] ?? [];
  const d = designsFor(occasionId).find((x) => x.id === designId);
  return (d && d.fx) || fxMap[occasionId] || [];
}

export function coverTitle(occasionId: string): string {
  return (CARD_COVER_TITLE as Record<string, string>)[occasionId] ?? "For You";
}
