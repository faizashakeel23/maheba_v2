import type { ProviderCategory } from "./types";

export const COLORS = {
  cream: "#FFFAF7",
  card: "#FFFFFF",
  plum: "#4A2340",
  plumSoft: "#8B4A63",
  plumFaint: "#B98AA0",
  blush: "#F45B8D",
  blushDeep: "#D63F72",
  blushSoft: "#FFE9F1",
  blushBorder: "#FFD3E3",
  green: "#22C55E",
  greenDeep: "#16A34A",
  white: "#FFFFFF",
};

export const FONTS = {
  display: "Girlish",
  body: undefined as string | undefined, // platform default (rounded on neither; keep readable)
};

interface CategoryTheme {
  label: string;
  primary: string;
  deep: string;
  soft: string;
  onSoft: string;
}

export const CATEGORY_THEMES: Record<ProviderCategory, CategoryTheme> = {
  makeup: {
    label: "Makeup",
    primary: "#F43F5E",
    deep: "#BE123C",
    soft: "#FFE4EC",
    onSoft: "#BE123C",
  },
  henna: {
    label: "Henna",
    primary: "#8B5CF6",
    deep: "#6D28D9",
    soft: "#EDE9FE",
    onSoft: "#6D28D9",
  },
  baking: {
    label: "Baking",
    primary: "#FB923C",
    deep: "#C2410C",
    soft: "#FFEDD5",
    onSoft: "#C2410C",
  },
};
