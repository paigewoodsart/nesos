"use client";

import { useState, useEffect, useCallback } from "react";
import type { Theme } from "@/lib/theme";

const LOCAL_KEY = "nesos-theme";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("original");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_KEY) as Theme | null;
      if (saved === "neutral") setThemeState(saved);
    } catch {}
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try { localStorage.setItem(LOCAL_KEY, next); } catch {}
  }, []);

  return { theme, setTheme };
}
