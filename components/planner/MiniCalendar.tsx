"use client";

import { useState } from "react";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TEAL = "#1a759f";

export function MiniCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Build day grid — week starts Monday
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday-based offset: Sun=6, Mon=0 ...
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = startOffset + lastDay.getDate();
  const rows = Math.ceil(totalCells / 7);

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="flex flex-col gap-2 select-none" style={{ fontFamily: "var(--font-body)" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={prev}
          className="w-6 h-6 flex items-center justify-center rounded-sm hover:bg-paper-line/30 transition-colors text-paper-ink-light hover:text-paper-ink"
        >
          <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
            <path d="M6 1L1 6l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="text-xs font-semibold tracking-[0.12em] uppercase" style={{ color: TEAL }}>
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={next}
          className="w-6 h-6 flex items-center justify-center rounded-sm hover:bg-paper-line/30 transition-colors text-paper-ink-light hover:text-paper-ink"
        >
          <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
            <path d="M2 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[9px] font-semibold uppercase tracking-wider pb-1"
            style={{ color: "rgba(26,26,26,0.35)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: rows * 7 }).map((_, i) => {
          const dayNum = i - startOffset + 1;
          const valid = dayNum >= 1 && dayNum <= lastDay.getDate();
          const today_ = valid && isToday(dayNum);
          return (
            <div key={i} className="flex items-center justify-center h-6">
              {valid && (
                <span
                  className="w-6 h-6 flex items-center justify-center rounded-full text-[11px]"
                  style={{
                    backgroundColor: today_ ? TEAL : "transparent",
                    color: today_ ? "#fff" : "rgba(26,26,26,0.75)",
                    fontWeight: today_ ? 700 : 400,
                  }}
                >
                  {dayNum}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
