"use client";

import { dueDateUrgency, formatDueDate } from "@/lib/dates";

export function DueBadge({ due }: { due: string | null }) {
  const urgency = dueDateUrgency(due);
  const label = formatDueDate(due);

  if (!label) {
    return <span className="text-[10px] text-paper-line" style={{ fontFamily: "var(--font-serif)" }}>—</span>;
  }

  const styles: Record<string, string> = {
    overdue: "bg-paper-rust/15 text-paper-rust",
    today:   "bg-paper-rust/15 text-paper-rust",
    soon:    "bg-paper-rust/10 text-paper-rust/80",
    upcoming: "bg-paper-line/30 text-paper-ink-light",
  };

  return (
    <span
      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm whitespace-nowrap ${styles[urgency ?? "upcoming"]}`}
      style={{ fontFamily: "var(--font-serif)" }}
    >
      {label}
    </span>
  );
}
