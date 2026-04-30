"use client";

import { useState, useEffect, useCallback } from "react";
import { getTasksByWeek, saveTask, deleteTask, getRecurringTasks } from "@/lib/storage/tasks";
import { getNotesByWeek, saveNote } from "@/lib/storage/notes";
import { getGoalsByWeek, getLongtermGoals, saveGoal, deleteGoal } from "@/lib/storage/goals";
import { getBrainDump, saveBrainDump } from "@/lib/storage/braindump";
import type { Task, Note, Goal, BrainDump, BloomState } from "@/types";

export function useWeekStore(weekId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [weekGoals, setWeekGoals] = useState<Goal[]>([]);
  const [longtermGoals, setLongtermGoals] = useState<Goal[]>([]);
  const [brainDump, setBrainDumpState] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [t, n, wg, lg, bd] = await Promise.all([
        getTasksByWeek(weekId),
        getNotesByWeek(weekId),
        getGoalsByWeek(weekId),
        getLongtermGoals(),
        getBrainDump(weekId),
      ]);

      // Seed recurring tasks from any previous week if this week has none
      if (t.length === 0) {
        const recurring = await getRecurringTasks();
        const seeded: Task[] = recurring
          .filter((rt) => !t.find((existing) => existing.text === rt.text && existing.dayIndex === rt.dayIndex))
          .map((rt) => ({
            ...rt,
            id: crypto.randomUUID(),
            weekId,
            completed: false,
            createdAt: Date.now(),
          }));
        for (const task of seeded) {
          await saveTask(task);
        }
        if (!cancelled) {
          setTasks([...t, ...seeded]);
        }
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
    load();
    return () => { cancelled = true; };
  }, [weekId]);

  const addTask = useCallback(async (partial: Omit<Task, "id" | "weekId" | "createdAt" | "sortOrder">) => {
    const task: Task = {
      ...partial,
      id: crypto.randomUUID(),
      weekId,
      sortOrder: Date.now(),
      createdAt: Date.now(),
    };
    await saveTask(task);
    setTasks((prev) => [...prev, task]);
    return task;
  }, [weekId]);

  const toggleTask = useCallback(async (id: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      );
      const task = updated.find((t) => t.id === id);
      if (task) saveTask(task);
      return updated;
    });
  }, []);

  const removeTask = useCallback(async (id: string) => {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const renameTask = useCallback((id: string, text: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => t.id === id ? { ...t, text } : t);
      const task = updated.find((t) => t.id === id);
      if (task) saveTask(task);
      return updated;
    });
  }, []);

  const upsertNote = useCallback(async (dayIndex: number, text: string, photoIds?: string[]) => {
    const existing = notes.find((n) => n.dayIndex === dayIndex);
    const note: Note = existing
      ? { ...existing, text, photoIds: photoIds ?? existing.photoIds, updatedAt: Date.now() }
      : {
          id: crypto.randomUUID(),
          weekId,
          dayIndex,
          text,
          photoIds: photoIds ?? [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
    await saveNote(note);
    setNotes((prev) =>
      existing ? prev.map((n) => (n.id === note.id ? note : n)) : [...prev, note]
    );
    return note;
  }, [weekId, notes]);

  const addNotePhoto = useCallback(async (dayIndex: number, photoId: string) => {
    const existing = notes.find((n) => n.dayIndex === dayIndex);
    if (existing) {
      const updated: Note = { ...existing, photoIds: [...existing.photoIds, photoId], updatedAt: Date.now() };
      await saveNote(updated);
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } else {
      const note: Note = {
        id: crypto.randomUUID(),
        weekId,
        dayIndex,
        text: "",
        photoIds: [photoId],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveNote(note);
      setNotes((prev) => [...prev, note]);
    }
  }, [weekId, notes]);

  const addGoal = useCallback(async (text: string, type: "weekly" | "longterm") => {
    const goal: Goal = {
      id: crypto.randomUUID(),
      weekId: type === "weekly" ? weekId : null,
      text,
      completed: false,
      type,
      createdAt: Date.now(),
    };
    await saveGoal(goal);
    if (type === "weekly") {
      setWeekGoals((prev) => [...prev, goal]);
    } else {
      setLongtermGoals((prev) => [...prev, goal]);
    }
  }, [weekId]);

  const toggleGoal = useCallback(async (id: string) => {
    const toggle = (prev: Goal[]) => {
      const updated = prev.map((g) => g.id === id ? { ...g, completed: !g.completed } : g);
      const goal = updated.find((g) => g.id === id);
      if (goal) saveGoal(goal);
      return updated;
    };
    setWeekGoals(toggle);
    setLongtermGoals(toggle);
  }, []);

  const removeGoal = useCallback(async (id: string) => {
    await deleteGoal(id);
    setWeekGoals((prev) => prev.filter((g) => g.id !== id));
    setLongtermGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const updateBrainDump = useCallback(async (text: string) => {
    setBrainDumpState(text);
    const dump: BrainDump = { weekId, text, updatedAt: Date.now() };
    await saveBrainDump(dump);
  }, [weekId]);

  const bloomState: BloomState = (() => {
    const total = tasks.filter((t) => !t.completed).length;
    if (total <= 5) return "bud";
    if (total <= 12) return "blooming";
    return "overgrown";
  })();

  return {
    tasks,
    notes,
    weekGoals,
    longtermGoals,
    brainDump,
    bloomState,
    loaded,
    addTask,
    toggleTask,
    removeTask,
    renameTask,
    upsertNote,
    addNotePhoto,
    addGoal,
    toggleGoal,
    removeGoal,
    updateBrainDump,
  };
}
