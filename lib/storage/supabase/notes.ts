import type { Note } from "@/types";

export async function sbGetNotesByWeek(_userEmail: string, weekId: string): Promise<Note[]> {
  const res = await fetch(`/api/db/notes?weekId=${encodeURIComponent(weekId)}`);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).map(rowToNote);
}

export async function sbSaveNote(_userEmail: string, note: Note): Promise<void> {
  const res = await fetch("/api/db/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(note) });
  if (!res.ok) console.error("[sb] saveNote:", await res.text());
}

export async function sbDeleteNote(id: string): Promise<void> {
  const res = await fetch(`/api/db/notes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) console.error("[sb] deleteNote:", await res.text());
}

function rowToNote(r: Record<string, unknown>): Note {
  return {
    id: r.id as string,
    weekId: r.week_id as string,
    dayIndex: r.day_index as number,
    text: r.text as string,
    photoIds: (r.photo_ids as string[]) ?? [],
    createdAt: r.created_at as number,
    updatedAt: r.updated_at as number,
  };
}
