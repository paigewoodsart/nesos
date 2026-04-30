"use client";

import { useState, useEffect, useCallback } from "react";
import { savePhoto, getPhotosByNote, deletePhoto } from "@/lib/storage/photos";
import { Modal } from "@/components/ui/Modal";
import type { Photo } from "@/types";

interface PhotoAttachmentProps {
  noteId: string;
  photoIds: string[];
  onPhotoAdded: (photoId: string) => void;
}

interface Thumb {
  id: string;
  url: string;
  noteId: string;
  blob: Blob;
  mimeType: string;
  filename: string;
}

export function PhotoAttachment({ noteId, photoIds, onPhotoAdded }: PhotoAttachmentProps) {
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [preview, setPreview] = useState<Thumb | null>(null);
  const [transcribing, setTranscribing] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<Record<string, string>>({});

  useEffect(() => {
    let revoke: (() => void) | null = null;
    getPhotosByNote(noteId).then((photos) => {
      const loaded: Thumb[] = photos.map((p) => ({
        id: p.id,
        url: URL.createObjectURL(p.blob),
        noteId: p.noteId,
        blob: p.blob,
        mimeType: p.mimeType,
        filename: p.filename,
      }));
      setThumbs(loaded);
      revoke = () => loaded.forEach((t) => URL.revokeObjectURL(t.url));
    });
    return () => revoke?.();
  }, [noteId]);

  const handleFile = useCallback(async (file: File) => {
    const photo: Photo = {
      id: crypto.randomUUID(),
      noteId,
      blob: file,
      mimeType: file.type,
      filename: file.name,
      createdAt: Date.now(),
    };
    await savePhoto(photo);
    onPhotoAdded(photo.id);
    const url = URL.createObjectURL(file);
    setThumbs((prev) => [...prev, { id: photo.id, url, noteId, blob: file, mimeType: file.type, filename: file.name }]);
  }, [noteId, onPhotoAdded]);

  const handleRemove = useCallback(async (id: string) => {
    const thumb = thumbs.find((t) => t.id === id);
    if (thumb) URL.revokeObjectURL(thumb.url);
    await deletePhoto(id);
    setThumbs((prev) => prev.filter((t) => t.id !== id));
  }, [thumbs]);

  const transcribePhoto = useCallback(async (thumb: Thumb) => {
    setTranscribing(thumb.id);
    const form = new FormData();
    form.append("image", new Blob([await thumb.blob.arrayBuffer()], { type: thumb.mimeType }), thumb.filename);
    const res = await fetch("/api/ai/ocr", { method: "POST", body: form });
    const { text } = await res.json();
    setTranscription((prev) => ({ ...prev, [thumb.id]: text }));
    setTranscribing(null);
  }, []);

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-1.5 items-center">
        {thumbs.map((t) => (
          <div key={t.id} className="relative group w-14 h-14 flex-shrink-0">
            <img
              src={t.url}
              alt="note photo"
              className="w-full h-full object-cover rounded-sm border border-paper-line cursor-pointer"
              onClick={() => setPreview(t)}
            />
            <div className="absolute inset-0 bg-paper-ink/0 group-hover:bg-paper-ink/20 rounded-sm transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => transcribePhoto(t)}
                className="text-white text-[9px] font-bold bg-paper-ink/60 rounded px-1 py-0.5"
                title="Transcribe handwriting"
              >
                {transcribing === t.id ? "..." : "Aa"}
              </button>
              <button
                onClick={() => handleRemove(t.id)}
                className="text-white text-[9px] font-bold bg-paper-rust/70 rounded px-1 py-0.5"
                title="Remove photo"
              >
                ×
              </button>
            </div>
          </div>
        ))}

        <label className="w-14 h-14 flex-shrink-0 flex items-center justify-center border border-dashed border-paper-line rounded-sm cursor-pointer hover:border-paper-ink-light transition-colors">
          <span className="text-paper-line text-lg">+</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      </div>

      {Object.entries(transcription).length > 0 && (
        <div className="mt-2 space-y-2">
          {Object.entries(transcription).map(([id, text]) => (
            <div key={id} className="text-xs text-paper-ink-light bg-paper-warm border border-paper-line rounded-sm px-2 py-1.5" style={{ fontFamily: "var(--font-body)", fontStyle: "italic" }}>
              <p className="font-medium text-paper-ink-light mb-1 not-italic" style={{ fontFamily: "var(--font-serif)", fontSize: "10px" }}>Transcription</p>
              <p className="whitespace-pre-wrap">{text}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)}>
        {preview && (
          <img src={preview.url} alt="note preview" className="w-full rounded-sm" />
        )}
      </Modal>
    </div>
  );
}
