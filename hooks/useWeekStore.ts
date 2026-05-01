"use client";

import { useState, useEffect, useCallback } from "react";
import { getTasksByWeek, saveTask, deleteTask, getRecurringTasks } from "@/lib/storage/tasks";
import { getNotesByWeek, saveNote } from "@/lib/storage/notes";
import { getGoalsByWeek, getLongtermGoals, saveGoal, deleteGoal } from "@/lib/storage/goals";
import { getBrainDump, saveBrainDump } from "@/lib/storage/braindump";
import { sbGetTasksByWeek, sbGetRecurringTasks, sbSaveTask, sbDeleteTask } from "@/lib/storage/supabase/tasks";
import { sbGetNotesByWeek, sbSaveNote } from "@/lib/storage/supabase/notes";
import { sbGetGoalsByWeek, sbGetLongtermGoals, sbSaveGoal, sbDeleteGoal } from "@/lib/storage/supabase/goals";
import { sbGetBrainDump, sbSaveBrainDump } from "@/lib/storage/supabase/braindump";
import type { Task, Note, Goal, BrainDump, BloomState } from "@/types";

export function useWeekStore(weekId: string, userEmail?: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [weekGoals, setWeekGoals] = useState<Goal[]>([]);
  const [longtermGoals, setLongtermGoals] = useState<Goal[]>([]);
  const [brainDump, setBrainDumpState] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  const sb = !!userEmail;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let t: Task[], n: Note[], wg: Goal[], lg: Goal[], bd: BrainDump | undefined;
      let usingSb = sb;
      try {
        [t, n, wg, lg, bd] = await Promise.all([
          sb ? sbGetTasksByWeek(userEmail!, weekId) : getTasksByWeek(weekId),
          sb ? sbGetNotesByWeek(userEmail!, weekId) : getNotesByWeek(weekId),
          sb ? sbGetGoalsByWeek(userEmail!, weekId) : getGoalsByWeek(weekId),
          sb ? sbGetLongtermGoals(userEmail!) : getLongtermGoals(),
          sb ? sbGetBrainDump(userEmail!, weekId) : getBrainDump(weekId),
        ]);
      } catch (err) {
        console.error("[useWeekStore] Supabase load failed, falling back to IDB:", err);
        usingSb = false;
        [t, n, wg, lg, bd] = await Promise.all([
          getTasksByWeek(weekId),
          getNotesByWeek(weekId),
          getGoalsByWeek(weekId),
          getLongtermGoals(),
          getBrainDump(weekId),
        ]);
      }

      if (t.length === 0) {
        const recurring = usingSb
          ? await sbGetRecurringTasks(userEmail!).catch(() => getRecurringTasks())
          : await getRecurringTasks();
        const seeded: Task[] = recurring
          .filter((rt) => !t.find((e) => e.text === rt.text && e.dayIndex === rt.dayIndex))
          .map((rt) => ({ ...rt, id: crypto.randomUUID(), weekId, completed: false, createdAt: Date.now() }));
        for (const task of seeded) {
          if (sb) await sbSaveTask(userEmail!, task); else await saveTask(task);
        }
        if (!cancelled) setTasks([...t, ...seeded]);
      } else if (!cancelled) {
        setTasks(t);
      }

      if (!cancelled) {
        setNotes(n);
        setWeekGoals(wg);
        setLongtermGoals(lg);
        setBrainDumpState(bd?.text ?? "");
        setLoaded(true);
      }
    }
    setLoaded(false);
    load().catch((err) => { console.error("[useWeekStore] load crashed:", err); setLoaded(true); });
    return () => { cancelled = true; };
  }, [weekId, userEmail]); // eslint-disable-line

  const save = useCallback((task: Task) => {
    if (userEmail) sbSaveTask(userEmail, task); else saveTask(task);
  }, [userEmail]);

  const addTask = useCallback(async (partial: Omit<Task, "id" | "weekId" | "createdAt" | "sortOrder">) => {
    const task: Task = { ...partial, id: crypto.randomUUID(), weekId, sortOrder: Date.now(), createdAt: Date.now() };
    if (userEmail) await sbSaveTask(userEmail, task); else await saveTask(task);
    setTasks((prev) => [...prev, task]);
    return task;
  }, [weekId, userEmail]);

  const toggleTask = useCallback(async (id: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t);
      const task = updated.find((t) => t.id === id);
      if (task) { if (userEmail) sbSaveTask(userEmail, task); else saveTask(task); }
      return updated;
    });
  }, [userEmail]);

  const removeTask = useCallback(async (id: string) => {
    if (userEmail) await sbDeleteTask(id); else await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [userEmail]);

  const renameTask = useCallback((id: string, text: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => t.id === id ? { ...t, text } : t);
      const task = updated.find((t) => t.id === id);
      if (task) { if (userEmail) sbSaveTask(userEmail, task); else saveTask(task); }
      return updated;
    });
  }, [userEmail]);

  const upsertNote = useCallback(async (dayIndex: number, text: string, photoIds?: string[]) => {
    const existing = notes.find((n) => n.dayIndex === dayIndex);
    const note: Note = existing
      ? { ...existing, text, photoIds: photoIds ?? existing.photoIds, updatedAt: Date.now() }
      : { id: crypto.randomUUID(), weekId, dayIndex, text, photoIds: photoIds ?? [], createdAt: Date.now(), updatedAt: Date.now() };
    if (userEmail) await sbSaveNote(userEmail, note); else await saveNote(note);
    setNotes((prev) => existing ? prev.map((n) => n.id === note.id ? note : n) : [...prev, note]);
    return note;
  }, [weekId, notes, userEmail]);

  const addNotePhoto = useCallback(async (dayIndex: number, photoId: string) => {
    const existing = notes.find((n) => n.dayIndex === dayIndex);
    if (existing) {
      const updated: Note = { ...existing, photoIds: [...existing.photoIds, photoId], updatedAt: Date.now() };
      if (userEmail) await sbSaveNote(userEmail, updated); else await saveNote(updated);
      setNotes((prev) => prev.map((n) => n.id === updated.id ? updated : n));
    } else {
      const note: Note = { id: crypto.randomUUID(), weekId, dayIndex, text: "", photoIds: [photoId], createdAt: Date.now(), updatedAt: Date.now() };
      if (userEmail) await sbSaveNote(userEmail, note); else await saveNote(note);
      setNotes((prev) => [...prev, note]);
    }
  }, [weekId, notes, userEmail]);

  const addGoal = useCallback(async (text: string, type: "weekly" | "longterm") => {
    const goal: Goal = { id: crypto.randomUUID(), weekId: type === "weekly" ? weekId : null, text, completed: false, type, createdAt: Date.now() };
    if (userEmail) await sbSaveGoal(userEmail, goal); else await saveGoal(goal);
    if (type === "weekly") setWeekGoals((prev) => [...prev, goal]);
    else setLongtermGoals((prev) => [...prev, goal]);
  }, [weekId, userEmail]);

  const toggleGoal = useCallback(async (id: string) => {
    const toggle = (prev: Goal[]) => {
      const updated = prev.map((g) => g.id === id ? { ...g, completed: !g.completed } : g);
      const goal = updated.find((g) => g.id === id);
      if (goal) { if (userEmail) sbSaveGoal(userEmail, goal); else saveGoal(goal); }
      return updated;
    };
    setWeekGoals(toggle);
    setLongtermGoals(toggle);
  }, [userEmail]);

  const removeGoal = useCallback(async (id: string) => {
    if (userEmail) await sbDeleteGoal(id); else await deleteGoal(id);
    setWeekGoals((prev) => prev.filter((g) => g.id !== id));
    setLongtermGoals((prev) => prev.filter((g) => g.id !== id));
  }, [userEmail]);

  const renameGoal = useCallback((id: string, text: string) => {
    const update = (prev: Goal[]) => {
      const updated = prev.map((g) => g.id === id ? { ...g, text } : g);
      const goal = updated.find((g) => g.id === id);
      if (goal) { if (userEmail) sbSaveGoal(userEmail, goal); else saveGoal(goal); }
      return updated;
    };
    setWeekGoals(update);
    setLongtermGoals(update);
  }, [userEmail]);

  const updateBrainDump = useCallback(async (text: string) => {
    setBrainDumpState(text);
    const dump: BrainDump = { weekId, text, updatedAt: Date.now() };
    if (userEmail) await sbSaveBrainDump(userEmail, dump); else await saveBrainDump(dump);
  }, [weekId, userEmail]);

  const bloomState: BloomState = (() => {
    const total = tasks.filter((t) => !t.completed).length;
    if (total <= 5) return "bud";
    if (total <= 12) return "blooming";
    return "overgrown";
  })();

  // suppress unused warning
  void save;

  return { tasks, notes, weekGoals, longtermGoals, brainDump, bloomState, loaded, addTask, toggleTask, removeTask, renameTask, upsertNote, addNotePhoto, addGoal, toggleGoal, removeGoal, renameGoal, updateBrainDump };
}
