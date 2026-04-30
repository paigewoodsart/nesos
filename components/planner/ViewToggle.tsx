"use client";

export type View = "board" | "calendar" | "month";

interface ViewToggleProps {
  view: View;
  onChange: (v: View) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  const labels: Record<View, string> = { board: "Board", calendar: "Calendar", month: "Month" };
  return (
    <div className="flex items-center gap-0.5 bg-paper-warm rounded-sm p-0.5 border border-paper-line">
      {(["board", "calendar", "month"] as View[]).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] rounded-sm transition-all ${
            view === v
              ? "bg-paper-cream text-paper-rust shadow-sm"
              : "text-paper-ink-light hover:text-paper-ink"
          }`}
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {labels[v]}
        </button>
      ))}
    </div>
  );
}
