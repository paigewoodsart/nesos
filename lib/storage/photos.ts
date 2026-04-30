import { getDb } from "./db";
import type { Photo } from "@/types";

export async function getPhotosByNote(noteId: string): Promise<Photo[]> {
  const db = await getDb();
  return db.getAllFromIndex("photos", "by-note", noteId);
}

export async function savePhoto(photo: Photo): Promise<void> {
  const db = await getDb();
  await db.put("photos", photo);
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("photos", id);
}
