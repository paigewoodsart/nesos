"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addMonths, subMonths } from "date-fns";
import { prevWeekId, nextWeekId, getWeekId, formatWeekRange } from "@/lib/dates";
import { AuthButton } from "@/components/auth/AuthButton";
import { ViewToggle } from "./ViewToggle";
import type { View } from "./ViewToggle";
import type { BloomState } from "@/types";

const BLOOM_ICONS: Record<BloomState, string> = {
  bud: "🌱",
  blooming: "🌸",
  overgrown: "🌿",
};

const BLOOM_TIPS: Record<BloomState, string> = {
  bud: "A calm week — space to breathe.",
  blooming: "In full bloom. You've got this.",
  overgrown: "That's a lot on your plate — want to move something?",
};

interface WeekNavProps {
  weekId: string;
  bloomState: BloomState;
  view: View;
  onViewChange: (v: View) => void;
  activeDate: Date;
  onDayChange: (d: Date) => void;
}

function NesosPhonetic() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative mt-0.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] tracking-widest text-paper-ink-light hover:text-paper-ink transition-colors select-none"
        style={{ fontFamily: "var(--font-body)", letterSpacing: "0.18em" }}
      >
        νῆσος · nē·sos
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-6 z-50 w-56 rounded-sm shadow-lg px-4 py-3 animate-fade-up"
            style={{
              backgroundColor: "rgba(255,255,255,0.96)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(26,26,26,0.08)",
              boxShadow: "0 8px 32px rgba(26,26,26,0.12)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-paper-ink-light mb-1" style={{ fontFamily: "var(--font-body)" }}>
              ancient greek
            </p>
            <p className="text-xl font-semibold text-paper-ink mb-0.5" style={{ fontFamily: "var(--font-serif)" }}>
              island
            </p>
            <p className="text-[11px] leading-relaxed text-paper-ink-light italic mt-2" style={{ fontFamily: "var(--font-serif)" }}>
              where scattered thoughts find shore.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export function WeekNav({ weekId, bloomState, view, onViewChange, activeDate, onDayChange }: WeekNavProps) {
  const router = useRouter();
  const isCurrentWeek = weekId === getWeekId(new Date());

  const handlePrev = () => {
    if (view === "month") {
      onDayChange(subMonths(activeDate, 1));
    } else {
      router.push(`/planner/${prevWeekId(weekId)}`);
    }
  };

  const handleNext = () => {
    if (view === "month") {
      onDayChange(addMonths(activeDate, 1));
    } else {
      router.push(`/planner/${nextWeekId(weekId)}`);
    }
  };

  const handleToday = () => {
    const today = new Date();
    onDayChange(today);
    router.push(`/planner/${getWeekId(today)}`);
  };

  const showNav = view !== "board";
  const navLabel = view === "month"
    ? format(activeDate, "MMMM yyyy")
    : formatWeekRange(weekId);
  const isCurrentPeriod = view === "month"
    ? format(activeDate, "yyyy-MM") === format(new Date(), "yyyy-MM")
    : isCurrentWeek;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 border-b-2 border-paper-ink/10 bg-paper-cream/98 backdrop-blur-sm">
      <div className="flex items-center gap-5">
        <div className="flex flex-col leading-none">
          <h1
            className="text-xl font-bold tracking-tight leading-none"
            style={{ fontFamily: "var(--font-aboreto)", color: "var(--color-paper-rust)" }}
          >
            Nesos
          </h1>
          <NesosPhonetic />
        </div>
        {showNav && (
          <>
            <span className="text-paper-line text-xl font-thin">|</span>
            <span
              className="text-sm text-paper-ink-light italic font-medium"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {navLabel}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <ViewToggle view={view} onChange={onViewChange} />
        <AuthButton />

        {showNav && (
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-paper-warm text-paper-ink-light hover:text-paper-ink transition-all text-base font-medium"
              aria-label="Previous"
            >
              ←
            </button>
            {!isCurrentPeriod && (
              <button
                onClick={handleToday}
                className="text-xs px-3 py-1.5 rounded-full border-2 border-paper-rust text-paper-rust hover:bg-paper-rust hover:text-white transition-all font-medium"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Today
              </button>
            )}
            <button
              onClick={handleNext}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-paper-warm text-paper-ink-light hover:text-paper-ink transition-all text-base font-medium"
              aria-label="Next"
            >
              →
            </button>
          </div>
        )}

        <div className="relative group">
          <span className="text-xl cursor-default select-none" title={BLOOM_TIPS[bloomState]}>
            {BLOOM_ICONS[bloomState]}
          </span>
          <div
            className="absolute right-0 top-9 hidden group-hover:block z-50 bg-paper-warm border border-paper-line rounded-sm px-3 py-2 text-sm text-paper-ink-light w-52 shadow-md"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {BLOOM_TIPS[bloomState]}
          </div>
        </div>
      </div>
    </header>
  );
}
