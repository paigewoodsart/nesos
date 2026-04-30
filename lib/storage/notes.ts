import { getDb } from "./db";
import type { Note } from "@/types";

export async function getNotesByWeek(weekId: string): Promise<Note[]> {
  const db = await getDb();
  return db.getAllFromIndex("notes", "by-week", weekId);
}

export async function saveNote(note: Note): Promise<void> {
  const db = await getDb();
  await db.put("notes", note);
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("notes", id);
}
