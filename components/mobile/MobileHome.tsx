"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { DueBadge } from "@/components/shared/DueBadge";
import { parseDueDate, isWithinNextDays, isWithinNext24Hours, formatEventTime, isoToMinutes } from "@/lib/dates";
import type { Client, ClientTask, CalendarEvent } from "@/types";

interface MobileHomeProps {
  onOpenDrawer: () => void;
  clients: Client[];
  tasksByClient: Record<string, ClientTask[]>;
  events: CalendarEvent[];
}

function BloomIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="4" fill="#D4909E"/>
      {[0,60,120,180,240,300].map((deg) => (
        <ellipse key={deg} cx="14" cy="14" rx="2.5" ry="6"
          fill="#D4909E" opacity="0.7"
          transform={`rotate(${deg} 14 14) translate(0 -8)`}/>
      ))}
    </svg>
  );
}

function BlobShape() {
  return (
    <svg viewBox="0 0 300 230" fill="none" className="w-full max-w-[320px]" style={{ filter: "drop-shadow(0 6px 28px rgba(0,0,0,0.09))" }}>
      <path
        d="M 145,18 C 185,5 235,20 258,58 C 278,90 272,138 248,166 C 222,196 180,208 140,204 C 98,200 58,182 36,152 C 14,122 12,80 30,52 C 50,22 105,32 145,18 Z"
        fill="rgba(255,255,255,0.90)"
      />
    </svg>
  );
}

export function MobileHome({ onOpenDrawer, clients, tasksByClient, events }: MobileHomeProps) {
  const [affirmation, setAffirmation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const todayKey = `affirmation-${format(new Date(), "yyyy-MM-dd")}`;
    const cached = localStorage.getItem(todayKey);
    if (cached) { setAffirmation(cached); setLoading(false); return; }

    fetch("/api/ai/affirmation", { method: "POST" })
      .then((r) => r.json())
      .then(({ text }) => {
        setAffirmation(text);
        localStorage.setItem(todayKey, text);
      })
      .catch(() => setAffirmation("You are exactly where you need to be."))
      .finally(() => setLoading(false));
  }, []);

  // ── Aggregated data for scroll section ─────────────────────────
  const allActive = clients.flatMap((c) =>
    (tasksByClient[c.id] ?? [])
      .filter((t) => !t.archived)
      .map((t) => ({ ...t, clientColor: c.color, clientName: c.name }))
  );

  const todayMeetings = events
    .filter((e) => !e.isAllDay && isWithinNext24Hours(e.start))
    .sort((a, b) => isoToMinutes(a.start) - isoToMinutes(b.start));

  const todayTasks = allActive.filter((t) => {
    const d = parseDueDate(t.dueDate);
    return d ? isWithinNextDays(d, 1) : false;
  });

  const allTasksSorted = [...allActive]
    .filter((t) => !t.done)
    .sort((a, b) => {
      const da = parseDueDate(a.dueDate);
      const db = parseDueDate(b.dueDate);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.getTime() - db.getTime();
    });

  const hasToday = todayMeetings.length > 0 || todayTasks.length > 0;

  return (
    <div className="h-screen overflow-y-auto mobile-scroll" style={{ scrollSnapType: "y proximity" }}>

      {/* ── Screen 1: Affirmation ── */}
      <div className="relative h-screen flex flex-col board-breathe" style={{ scrollSnapAlign: "start", flexShrink: 0 }}>
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 pt-8 pb-3">
          <button className="w-11 h-11 flex items-center justify-center" aria-label="Home">
            <BloomIcon />
          </button>
          <button
            onClick={onOpenDrawer}
            className="w-11 h-11 flex items-center justify-center text-paper-ink"
            aria-label="Open menu"
          >
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
              <path d="M1 1h20M1 9h20M1 17h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Blob + affirmation */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="relative w-full max-w-[320px]">
            <BlobShape />
            <div className="absolute inset-0 flex items-center justify-center p-10">
              {loading ? (
                <p className="text-center text-sm italic text-paper-ink-light animate-pulse-soft" style={{ fontFamily: "var(--font-serif)" }}>
                  finding your words...
                </p>
              ) : (
                <p className="text-center text-base leading-relaxed italic text-paper-ink" style={{ fontFamily: "var(--font-serif)" }}>
                  {affirmation}{" "}
                  <span style={{ color: "#D4909E", fontStyle: "normal" }}>♥</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {allTasksSorted.length > 0 && (
          <div className="flex justify-center pb-10">
            <span className="text-[10px] text-paper-ink/40 tracking-widest uppercase" style={{ fontFamily: "var(--font-body)" }}>
              scroll for tasks ↓
            </span>
          </div>
        )}
      </div>

      {/* ── Screen 2: Today + All Tasks ── */}
      {allTasksSorted.length > 0 || hasToday ? (
        <div className="min-h-screen bg-paper-cream px-5 pt-8 pb-24" style={{ scrollSnapAlign: "start" }}>

          {/* Today section */}
          {hasToday && (
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ fontFamily: "var(--font-body)", color: "#D4909E" }}>
                Today
              </p>
              {todayMeetings.map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-2.5 border-b border-paper-line/40">
                  <span className="text-xs text-paper-ink-light w-10 flex-shrink-0" style={{ fontFamily: "var(--font-serif)" }}>
                    {formatEventTime(e.start)}
                  </span>
                  <span className="flex-1 text-sm text-paper-ink" style={{ fontFamily: "var(--font-serif)" }}>{e.summary}</span>
                </div>
              ))}
              {todayTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-paper-line/40">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.clientColor }} />
                  <span className="flex-1 text-sm text-paper-ink truncate" style={{ fontFamily: "var(--font-serif)" }}>{t.text}</span>
                  <DueBadge due={t.dueDate} />
                </div>
              ))}
            </div>
          )}

          {/* All tasks */}
          {allTasksSorted.length > 0 && (
            <>
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ fontFamily: "var(--font-body)", color: "#F4956A" }}>
                All Tasks
              </p>
              {allTasksSorted.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-paper-line/40">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.clientColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-paper-ink truncate" style={{ fontFamily: "var(--font-serif)" }}>{t.text}</p>
                    <p className="text-[10px] text-paper-ink-light" style={{ fontFamily: "var(--font-body)" }}>{t.clientName}</p>
                  </div>
                  <DueBadge due={t.dueDate} />
                </div>
              ))}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
