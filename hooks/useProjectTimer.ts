"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { getWeekId, getWeekDays, isoToMinutes, TZ } from "@/lib/dates";
import type { ClientSession } from "@/types";

const STORAGE_KEY = "nesos-active-timer";

interface ActiveTimer {
  clientId: string;
  startedAt: number; // epoch ms
}

function loadActiveTimer(): ActiveTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveActiveTimer(timer: ActiveTimer | null) {
  try {
    if (timer) localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function useProjectTimer(onAddSession: (session: Omit<ClientSession, "id" | "createdAt">) => void) {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const onAddSessionRef = useRef(onAddSession);
  onAddSessionRef.current = onAddSession;
  // Source of truth for "what's currently running", read synchronously by
  // start()/stop() so the side-effecting session log never runs inside a
  // React state updater (which may be invoked more than once in Strict Mode).
  const activeTimerRef = useRef<ActiveTimer | null>(null);

  useEffect(() => {
    const loaded = loadActiveTimer();
    activeTimerRef.current = loaded;
    setActiveTimer(loaded);
  }, []);

  useEffect(() => {
    if (!activeTimer) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activeTimer]);

  const logSession = useCallback((timer: ActiveTimer, endedAt: number) => {
    const startIso = new Date(timer.startedAt).toISOString();
    const endIso = new Date(endedAt).toISOString();
    const weekId = getWeekId(new Date(endedAt));
    const zonedEnd = toZonedTime(new Date(endedAt), TZ);
    const dayIndex = (zonedEnd.getDay() + 6) % 7;
    const day = getWeekDays(weekId)[dayIndex];
    const actualMinutes = Math.max(1, Math.round((endedAt - timer.startedAt) / 60000));
    onAddSessionRef.current({
      clientId: timer.clientId,
      weekId,
      dayIndex,
      startMinute: isoToMinutes(startIso),
      endMinute: isoToMinutes(endIso),
      actualMinutes,
      notes: "",
      date: format(day, "yyyy-MM-dd"),
    });
  }, []);

  const stop = useCallback(() => {
    const prev = activeTimerRef.current;
    if (prev) logSession(prev, Date.now());
    activeTimerRef.current = null;
    saveActiveTimer(null);
    setActiveTimer(null);
  }, [logSession]);

  const start = useCallback((clientId: string) => {
    const prev = activeTimerRef.current;
    if (prev) logSession(prev, Date.now());
    const next = { clientId, startedAt: Date.now() };
    activeTimerRef.current = next;
    saveActiveTimer(next);
    setActiveTimer(next);
    setNowTick(Date.now());
  }, [logSession]);

  const toggle = useCallback((clientId: string) => {
    if (activeTimerRef.current?.clientId === clientId) {
      stop();
    } else {
      start(clientId);
    }
  }, [start, stop]);

  const elapsedMs = activeTimer ? nowTick - activeTimer.startedAt : 0;

  return {
    activeClientId: activeTimer?.clientId ?? null,
    elapsedMs,
    toggle,
  };
}
