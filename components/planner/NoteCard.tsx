"use client";

import { useState, useCallback, useRef } from "react";
import { PhotoAttachment } from "./PhotoAttachment";
import type { Note } from "@/types";

interface NoteCardProps {
  note: Note | undefined;
  dayIndex: number;
  weekId: string;
  onSave: (text: string, photoIds?: string[]) => void;
  onAddPhoto: (photoId: string) => void;
}

export function NoteCard({ note, dayIndex, weekId, onSave, onAddPhoto }: NoteCardProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(note?.text ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((value: string) => {
    setText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSave(value), 600);
  }, [onSave]);

  const noteId = note?.id ?? `${weekId}-${dayIndex}`;

  return (
    <div className="px-3 pb-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-medium text-paper-ink-light hover:text-paper-rust transition-colors flex items-center gap-1.5 py-1"
        style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
      >
        <span className="text-sm">{open ? "▾" : "▸"}</span>
        <span>{note?.text ? "notes" : "add note..."}</span>
      </button>

      {open && (
        <div className="mt-2 animate-fade-up">
          <textarea
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="jot something down..."
            rows={3}
            className="w-full text-sm bg-paper-warm/60 border-2 border-paper-line rounded-sm px-3 py-2 outline-none resize-none text-paper-ink placeholder:text-paper-line/70 focus:border-paper-ink-light transition-colors leading-relaxed"
            style={{ fontFamily: "var(--font-body)", fontStyle: "italic" }}
          />
          <PhotoAttachment
            noteId={noteId}
            photoIds={note?.photoIds ?? []}
            onPhotoAdded={onAddPhoto}
          />
        </div>
      )}
    </div>
  );
}
