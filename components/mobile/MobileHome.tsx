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

  const allActive = clients.flatMap((c) =>
    (tasksByClient[c.id] ?? []).filter((t) => !t.archived)
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
      <div className="relative h-screen flex flex-col board-breathe board-grid" style={{ scrollSnapAlign: "start", flexShrink: 0 }}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-8 pb-3 flex-shrink-0">
          <img src="/nesos-icon.webp" alt="Nesos" className="h-11 w-11 object-contain" />
          <button
            onClick={onOpenDrawer}
            className="w-11 h-11 flex items-center justify-center"
            aria-label="Open menu"
          >
            <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
              <rect y="0" width="24" height="2.5" rx="1.25" fill="rgba(26,26,26,0.45)"/>
              <rect y="7.75" width="24" height="2.5" rx="1.25" fill="rgba(26,26,26,0.45)"/>
              <rect y="15.5" width="24" height="2.5" rx="1.25" fill="rgba(26,26,26,0.45)"/>
            </svg>
          </button>
        </div>

        {/* Blob + affirmation */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div
            style={{
              borderRadius: "63% 37% 54% 46% / 55% 48% 52% 45%",
              background: "rgba(255,255,255,0.32)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: [
                "inset 0 2px 6px rgba(255,255,255,0.90)",
                "inset 0 -2px 4px rgba(0,0,0,0.06)",
                "0 10px 40px rgba(0,0,0,0.08)",
              ].join(", "),
              border: "1.5px solid rgba(255,255,255,0.75)",
              padding: "52px 44px",
              width: "100%",
              maxWidth: 340,
            }}
          >
            {loading ? (
              <p className="text-center text-sm italic text-paper-ink-light animate-pulse-soft" style={{ fontFamily: "var(--font-serif)" }}>
                finding your words...
              </p>
            ) : (
              <p className="text-center text-base leading-relaxed italic text-paper-ink" style={{ fontFamily: "var(--font-serif)" }}>
                {affirmation}{" "}
                <span style={{ color: "#9b72cf", fontStyle: "normal" }}>♥</span>
              </p>
            )}
          </div>
        </div>

        {/* Tagline + scroll hint */}
        <div className="flex flex-col items-center gap-2 pb-10 flex-shrink-0">
          <p className="text-[10px] tracking-[0.22em] uppercase text-paper-ink/35" style={{ fontFamily: "var(--font-body)" }}>
            Your work. Your rhythm. Your island.
          </p>
          {allTasksSorted.length > 0 && (
            <span className="text-[9px] text-paper-ink/30 tracking-widest uppercase" style={{ fontFamily: "var(--font-body)" }}>
              scroll for tasks ↓
            </span>
          )}
        </div>
      </div>

      {/* ── Screen 2: Today + All Tasks ── */}
      {allTasksSorted.length > 0 || hasToday ? (
        <div className="min-h-screen bg-paper-cream px-5 pt-8 pb-24" style={{ scrollSnapAlign: "start" }}>

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
