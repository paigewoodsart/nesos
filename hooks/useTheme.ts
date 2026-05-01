"use client";

import { useState, useEffect } from "react";

export type Theme = "default" | "blue" | "green" | "grey";

const KEY = "nesos-theme";
const CLASSES = ["theme-blue", "theme-green", "theme-grey"] as const;

function applyTheme(t: Theme) {
  document.documentElement.classList.remove(...CLASSES);
  if (t !== "default") document.documentElement.classList.add(`theme-${t}`);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("default");

  useEffect(() => {
    const saved = localStorage.getItem(KEY) as Theme | null;
    const initial = saved ?? "default";
    applyTheme(initial as Theme);
    setThemeState(initial as Theme);
  }, []);

  const setTheme = (t: Theme) => {
    applyTheme(t);
    localStorage.setItem(KEY, t);
    setThemeState(t);
  };

  return { theme, setTheme };
}
