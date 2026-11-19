"use client";

import { useState, useEffect, useCallback } from "react";
import type { Theme } from "@/lib/theme";

const THEME_KEY = "nesos-theme";
const CUSTOM_COLOR_KEY = "nesos-custom-bg-color";
const STATIC_BG_KEY = "nesos-static-background";
const DEFAULT_CUSTOM_COLOR = "#EBE5DE";

function saveRemote(patch: { theme?: string; customColor?: string; staticBackground?: boolean }) {
  fetch("/api/db/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }).catch(() => {});
}

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

    // Signed in: the account's saved appearance wins, so the theme matches
    // across the website and the apps. Signed out, this 401s and is ignored.
    let cancelled = false;
    fetch("/api/db/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((s: { theme?: string | null; customColor?: string | null; staticBackground?: boolean | null } | null) => {
        if (cancelled || !s) return;
        try {
          if (s.theme === "original" || s.theme === "neutral" || s.theme === "custom") {
            setThemeState(s.theme);
            localStorage.setItem(THEME_KEY, s.theme);
          }
          if (s.customColor) {
            setCustomColorState(s.customColor);
            localStorage.setItem(CUSTOM_COLOR_KEY, s.customColor);
          }
          if (typeof s.staticBackground === "boolean") {
            setStaticBackgroundState(s.staticBackground);
            localStorage.setItem(STATIC_BG_KEY, String(s.staticBackground));
          }
        } catch {}
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    saveRemote({ theme: next });
  }, []);

  const setCustomColor = useCallback((hex: string) => {
    setCustomColorState(hex);
    try { localStorage.setItem(CUSTOM_COLOR_KEY, hex); } catch {}
    saveRemote({ customColor: hex });
  }, []);

  const setStaticBackground = useCallback((v: boolean) => {
    setStaticBackgroundState(v);
    try { localStorage.setItem(STATIC_BG_KEY, String(v)); } catch {}
    saveRemote({ staticBackground: v });
  }, []);

  return { theme, setTheme, customColor, setCustomColor, staticBackground, setStaticBackground };
}
