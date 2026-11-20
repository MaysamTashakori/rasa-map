/** Theme categories for the Theme tab, in display order. */
export type ThemeCategoryId =
  | "persian"
  | "neutral"
  | "sand"
  | "warm"
  | "water"
  | "green"
  | "light"
  | "dark"
  | "electric"
  | "rasa";

export interface ThemeCategory {
  id: ThemeCategoryId;
  /** Small color dot shown on the category tab. */
  color: string;
  /** A theme can be in several categories. */
  themeIds: string[];
}

export const THEME_CATEGORIES: ThemeCategory[] = [
  {
    id: "persian",
    color: "#1F9C9A",
    themeIds: ["chinar", "lajvard", "firuzeh", "zafaran", "anar", "kavir"],
  },
  {
    id: "neutral",
    color: "#A6A6A6",
    themeIds: ["carrara", "graphite", "noir", "japanese_ink", "contrast_zones", "swiss", "vintage_postcard", "modern_line", "nostalgi"],
  },
  { id: "sand", color: "#E4CF92", themeIds: ["sandstone", "desert", "rustic", "vintage_postcard", "nostalgi"] },
  {
    id: "warm",
    color: "#C8742E",
    themeIds: ["amber", "autumn", "copper", "heatwave", "terracotta", "rustic", "risograph", "night_bazaar", "eshgh", "nostalgi"],
  },
  {
    id: "water",
    color: "#4FA3B8",
    themeIds: [
      "terracotta",
      "copper_patina",
      "ocean",
      "mono_blue",
      "blueprint",
      "forest",
      "indigo_dye",
      "xray",
    ],
  },
  {
    id: "green",
    color: "#5FA36A",
    themeIds: ["sage", "forest", "emerald", "copper_patina", "rasa_forest", "rasa_paper"],
  },
  {
    id: "light",
    color: "#F0C6CC",
    themeIds: ["blush", "coral", "pastel_dream", "sage", "risograph", "swiss", "modern_line", "rasa_forest", "rasa_paper"],
  },
  {
    id: "dark",
    color: "#1B2438",
    themeIds: [
      "midnight_blue",
      "old_navy",
      "blueprint",
      "heatwave",
      "ruby",
      "emerald",
      "noir",
      "graphite",
      "indigo_dye",
      "night_bazaar",
      "aurora",
      "solar_dusk",
      "holo_foil",
      "eshgh",
      "rasa_emerald",
    ],
  },
  { id: "electric", color: "#FF2BD6", themeIds: ["neon", "cyber", "xray", "neon_tokyo", "vaporwave", "ultraviolet", "laser", "holo_foil"] },
  { id: "rasa", color: "#D6AD55", themeIds: ["rasa_night", "rasa_dusk", "rasa_forest", "rasa_emerald", "rasa_paper"] },
];

/** Themes of one category, kept in the list's own order. */
export function themesInCategory<T extends { id: string }>(
  themes: T[],
  categoryId: ThemeCategoryId,
): T[] {
  const ids = THEME_CATEGORIES.find((c) => c.id === categoryId)?.themeIds ?? [];
  return themes.filter((theme) => ids.includes(theme.id));
}
