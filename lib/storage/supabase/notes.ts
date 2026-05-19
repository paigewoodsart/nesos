import { supabase } from "@/lib/supabase";
import type { Note } from "@/types";

export async function sbGetNotesByWeek(userEmail: string, weekId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_email", userEmail)
    .eq("week_id", weekId);
  if (error) { console.error("[sb] getNotesByWeek:", error); throw error; }
  return (data ?? []).map(rowToNote);
}

export async function sbSaveNote(userEmail: string, note: Note): Promise<void> {
  const { error } = await supabase.from("notes").upsert({
    id: note.id,
    user_email: userEmail,
    week_id: note.weekId,
    day_index: note.dayIndex,
    text: note.text,
    photo_ids: note.photoIds,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  });
  if (error) console.error("[sb] saveNote:", error);
}

export async function sbDeleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) console.error("[sb] deleteNote:", error);
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
