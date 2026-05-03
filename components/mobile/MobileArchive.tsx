"use client";

import { MobileScreenHeader } from "./MobileScreenHeader";
import { DueBadge } from "@/components/shared/DueBadge";
import type { Client, ClientTask } from "@/types";

interface MobileArchiveProps {
  clients: Client[];
  tasksByClient: Record<string, ClientTask[]>;
  onOpenDrawer: () => void;
}

export function MobileArchive({ clients, tasksByClient, onOpenDrawer }: MobileArchiveProps) {
  return (
    <div className="flex flex-col h-dvh board-breathe board-grid">
      <MobileScreenHeader title="Archive" onOpenDrawer={onOpenDrawer} />
      <div className="flex-1 overflow-y-auto mobile-scroll px-5 py-4 bg-white/10 backdrop-blur-md">
        {clients.map((c) => {
          const archived = (tasksByClient[c.id] ?? []).filter((t) => t.archived);
          if (archived.length === 0) return null;
          return (
            <details key={c.id} className="mb-3">
              <summary className="flex items-center gap-2 py-2 cursor-pointer list-none select-none">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-base font-semibold text-paper-ink flex-1" style={{ fontFamily: "var(--font-body)" }}>{c.name}</span>
                <span className="text-[14px] text-paper-ink-light" style={{ fontFamily: "var(--font-body)" }}>{archived.length}</span>
              </summary>
              <div className="pl-4">
                {archived.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-paper-line/20 opacity-55">
                    <span className="flex-1 text-base line-through text-paper-ink truncate" style={{ fontFamily: "var(--font-body)" }}>{t.text}</span>
                    <DueBadge due={t.dueDate} />
                  </div>
                ))}
              </div>
            </details>
          );
        })}
        {clients.every((c) => (tasksByClient[c.id] ?? []).filter((t) => t.archived).length === 0) && (
          <p className="text-sm italic text-paper-ink-light text-center mt-12" style={{ fontFamily: "var(--font-body)" }}>Nothing archived yet.</p>
        )}
      </div>
    </div>
  );
}
