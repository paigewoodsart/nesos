"use client";

import { useTheme, type Theme } from "@/hooks/useTheme";

const THEMES: { id: Theme; label: string; bg: string }[] = [
  { id: "default", label: "Default", bg: "conic-gradient(from 0deg, #ffdfe5, #d9ed92, #52b69a, #168aad, #ffdfe5)" },
  { id: "blue",    label: "Blue",    bg: "#2b6cb0" },
  { id: "green",   label: "Green",   bg: "#c9eca9" },
  { id: "grey",    label: "Grey",    bg: "#6b7280" },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.22em] text-paper-ink-light mb-2" style={{ fontFamily: "var(--font-body)" }}>
        Theme
      </p>
      <div className="flex items-center gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            title={t.label}
            className="w-6 h-6 rounded-full transition-transform active:scale-90 hover:scale-110"
            style={{
              background: t.bg,
              outline: theme === t.id ? "2px solid rgba(26,26,26,0.5)" : "2px solid transparent",
              outlineOffset: 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
