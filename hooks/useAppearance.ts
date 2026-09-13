"use client";

import { useState, useEffect, useCallback } from "react";
import type { Theme } from "@/lib/theme";

const THEME_KEY = "nesos-theme";
const CUSTOM_COLOR_KEY = "nesos-custom-bg-color";
const STATIC_BG_KEY = "nesos-static-background";
const DEFAULT_CUSTOM_COLOR = "#EBE5DE";

export function useAppearance() {
  const [theme, setThemeState] = useState<Theme>("original");
  const [customColor, setCustomColorState] = useState(DEFAULT_CUSTOM_COLOR);
  const [staticBackground, setStaticBackgroundState] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
      if (savedTheme === "neutral" || savedTheme === "custom") setThemeState(savedTheme);
      const savedColor = localStorage.getItem(CUSTOM_COLOR_KEY);
      if (savedColor) setCustomColorState(savedColor);
      setStaticBackgroundState(localStorage.getItem(STATIC_BG_KEY) === "true");
    } catch {}
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try { localStorage.setItem(THEME_KEY, next); } catch {}
  }, []);

  const setCustomColor = useCallback((hex: string) => {
    setCustomColorState(hex);
    try { localStorage.setItem(CUSTOM_COLOR_KEY, hex); } catch {}
  }, []);

  const setStaticBackground = useCallback((v: boolean) => {
    setStaticBackgroundState(v);
    try { localStorage.setItem(STATIC_BG_KEY, String(v)); } catch {}
  }, []);

  return { theme, setTheme, customColor, setCustomColor, staticBackground, setStaticBackground };
}
