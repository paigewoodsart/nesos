export type Theme = "original" | "neutral";

export const THEME_LABELS: Record<Theme, string> = {
  original: "Original",
  neutral: "Neutral",
};

export const THEME_BOARD_CLASS: Record<Theme, string> = {
  original: "board-breathe",
  neutral: "board-breathe-neutral",
};

export const THEME_SWATCH_COLOR: Record<Theme, string> = {
  original: "#fce4ff",
  neutral: "#F0E8DC",
};

export const SYSTEM_DEFAULTS_ORIGINAL: Record<string, { color: string; title: string }> = {
  "__overdue__":   { color: "#5a9cd4", title: "Overdue" },
  "__today__":     { color: "#38b8cc", title: "Today" },
  "__week__":      { color: "#50c890", title: "This Week" },
  "__goals__":     { color: "#8aacee", title: "Goals" },
  "__braindump__": { color: "#c080ec", title: "Notes" },
};

export const CLIENT_COLORS_PALETTE_ORIGINAL: string[] = [
  "#d9ed92", "#b5e48c", "#99d98c", "#76c893",
  "#52b69a", "#40b07a", "#34a0a4", "#2d8f8f",
  "#00b4d8", "#5fa8d3", "#168aad", "#1a759f",
  "#0077b6", "#1e6091", "#184e77", "#023e8a",
  "#0d3b6e", "#03045e", "#457b9d", "#264653",
];

export const NEUTRAL_SYSTEM_DEFAULTS: Record<string, { color: string; title: string }> = {
  "__overdue__":   { color: "#F5C4B0", title: "Overdue" },
  "__today__":     { color: "#fceef2", title: "Today" },
  "__week__":      { color: "#ffe8d5", title: "This Week" },
  "__goals__":     { color: "#fcddd7", title: "Goals" },
  "__braindump__": { color: "#F5E6D3", title: "Notes" },
};

export const NEUTRAL_PROJECT_DEFAULT_COLOR = "#EDD5B8";

export const NEUTRAL_WARM_COLORS: string[] = [
  "#FDF6EE", "#F5E6D3", "#EDD5B8",
  "#E8C9A0", "#DEB482", "#C4956A",
  "#B87850", "#9A6038", "#7A4A28",
  "#C4857A", "#B86860", "#A05048",
  "#E8D0C0", "#D4B8A8", "#C0A090",
  "#fceef2", "#fcddd7", "#ffe8d5", "#F5C4B0",
  "#D8C8B8", "#B8A898", "#988878",
];

export const NEUTRAL_CLIENT_COLORS_PALETTE: string[] = [
  "#F5E6D3", "#EDD5B8", "#E8C9A0",
  "#DEB482", "#C4956A", "#B87850",
  "#9A6038", "#7A4A28",
  "#C4857A", "#B86860", "#A05048",
  "#E8D0C0", "#D4B8A8",
  "#fceef2", "#fcddd7", "#ffe8d5", "#F5C4B0",
  "#D8C8B8", "#B8A898", "#988878",
];
