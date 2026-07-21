"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { getWeekId, isoToMinutes, TZ } from "@/lib/dates";
import type { ClientSession } from "@/types";

const STORAGE_KEY = "nesos-project-timers";

interface TimerEntry {
  accumulatedMs: number;
  startedAt: number | null; // epoch ms of the current running segment, null when paused
  firstStartedAt: number | null; // epoch ms this logging chunk first began, for startMinute on log
}

type TimersMap = Record<string, TimerEntry>;

function loadTimers(): TimersMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTimers(timers: TimersMap) {
  try {
    const hasAny = Object.keys(timers).length > 0;
    if (hasAny) localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
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
  const [timers, setTimers] = useState<TimersMap>({});
  const [nowTick, setNowTick] = useState(() => Date.now());
  const onAddSessionRef = useRef(onAddSession);
  onAddSessionRef.current = onAddSession;
  // Source of truth read synchronously by play()/pause()/logTime() so the
  // side-effecting session log never runs inside a React state updater
  // (which may be invoked more than once in Strict Mode).
  const timersRef = useRef<TimersMap>({});

  useEffect(() => {
    const loaded = loadTimers();
    timersRef.current = loaded;
    setTimers(loaded);
  }, []);

  const anyRunning = Object.values(timers).some((t) => t.startedAt !== null);
  useEffect(() => {
    if (!anyRunning) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [anyRunning]);

  const commit = useCallback((next: TimersMap) => {
    timersRef.current = next;
    saveTimers(next);
    setTimers(next);
  }, []);

  const play = useCallback((clientId: string) => {
    const now = Date.now();
    const next: TimersMap = {};
    for (const [id, entry] of Object.entries(timersRef.current)) {
      if (id === clientId) continue;
      // pause whatever else was running, preserving its accumulated time
      if (entry.startedAt !== null) {
        next[id] = { ...entry, accumulatedMs: entry.accumulatedMs + (now - entry.startedAt), startedAt: null };
      } else {
        next[id] = entry;
      }
    }
    const existing = timersRef.current[clientId];
    next[clientId] = existing
      ? { ...existing, startedAt: now, firstStartedAt: existing.firstStartedAt ?? now }
      : { accumulatedMs: 0, startedAt: now, firstStartedAt: now };
    commit(next);
    setNowTick(now);
  }, [commit]);

  const pause = useCallback((clientId: string) => {
    const now = Date.now();
    const existing = timersRef.current[clientId];
    if (!existing || existing.startedAt === null) return;
    const next: TimersMap = {
      ...timersRef.current,
      [clientId]: { ...existing, accumulatedMs: existing.accumulatedMs + (now - existing.startedAt), startedAt: null },
    };
    commit(next);
  }, [commit]);

  const logTime = useCallback((clientId: string, label: string) => {
    const now = Date.now();
    const existing = timersRef.current[clientId];
    if (!existing) return;
    const totalMs = existing.accumulatedMs + (existing.startedAt !== null ? now - existing.startedAt : 0);
    if (totalMs <= 0) return;

    const startedAt = existing.firstStartedAt ?? now;
    const startIso = new Date(startedAt).toISOString();
    const endIso = new Date(now).toISOString();
    const weekId = getWeekId(new Date(now));
    const zonedNow = toZonedTime(new Date(now), TZ);
    const dayIndex = (zonedNow.getDay() + 6) % 7;
    const actualMinutes = Math.max(1, Math.round(totalMs / 60000));

    onAddSessionRef.current({
      clientId,
      weekId,
      dayIndex,
      startMinute: isoToMinutes(startIso),
      endMinute: isoToMinutes(endIso),
      actualMinutes,
      notes: label,
      date: formatInTimeZone(new Date(now), TZ, "yyyy-MM-dd"),
    });

    const next = { ...timersRef.current };
    delete next[clientId];
    commit(next);
  }, [commit]);

  const discard = useCallback((clientId: string) => {
    const next = { ...timersRef.current };
    delete next[clientId];
    commit(next);
  }, [commit]);

  const getElapsedMs = useCallback((clientId: string) => {
    const entry = timers[clientId];
    if (!entry) return 0;
    return entry.accumulatedMs + (entry.startedAt !== null ? nowTick - entry.startedAt : 0);
  }, [timers, nowTick]);

  const isRunning = useCallback((clientId: string) => {
    const entry = timers[clientId];
    return !!entry && entry.startedAt !== null;
  }, [timers]);

  const hasElapsed = useCallback((clientId: string) => {
    const entry = timers[clientId];
    return !!entry && (entry.accumulatedMs > 0 || entry.startedAt !== null);
  }, [timers]);

  return {
    play,
    pause,
    logTime,
    discard,
    getElapsedMs,
    isRunning,
    hasElapsed,
  };
}
