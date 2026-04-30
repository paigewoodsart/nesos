"use client";

export function ProgressBar({ done, total, color }: { done: number; total: number; color: string }) {
  if (total === 0) {
    return (
      <span className="text-xs text-paper-ink-light italic" style={{ fontFamily: "var(--font-serif)" }}>
        No tasks yet.
      </span>
    );
  }

  const pct = Math.round((done / total) * 100);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-paper-line/50 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-paper-ink-light flex-shrink-0" style={{ fontFamily: "var(--font-serif)" }}>
        {done}/{total}
      </span>
    </div>
  );
}
