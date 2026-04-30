"use client";

import { useState } from "react";
import { getDb } from "@/lib/storage/db";
import { sbSaveTask } from "@/lib/storage/supabase/tasks";
import { sbSaveNote } from "@/lib/storage/supabase/notes";
import { sbSaveGoal } from "@/lib/storage/supabase/goals";
import { sbSaveBrainDump } from "@/lib/storage/supabase/braindump";
import { sbSaveClient, sbSaveClientTask, sbSaveSession } from "@/lib/storage/supabase/clients";
import type { Task, Note, Goal, BrainDump, Client, ClientTask, ClientSession } from "@/types";

interface Props {
  userEmail: string;
}

export function MigrateDataButton({ userEmail }: Props) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [detail, setDetail] = useState("");

  const migrate = async () => {
    setStatus("running");
    setDetail("Opening local database...");
    try {
      const db = await getDb();

      setDetail("Migrating tasks...");
      const tasks = await db.getAll("tasks") as Task[];
      for (const t of tasks) await sbSaveTask(userEmail, t);

      setDetail("Migrating notes...");
      const notes = await db.getAll("notes") as Note[];
      for (const n of notes) await sbSaveNote(userEmail, n);

      setDetail("Migrating goals...");
      const goals = await db.getAll("goals") as Goal[];
      for (const g of goals) await sbSaveGoal(userEmail, g);

      setDetail("Migrating brain dumps...");
      const dumps = await db.getAll("braindumps") as BrainDump[];
      for (const d of dumps) await sbSaveBrainDump(userEmail, d);

      setDetail("Migrating clients...");
      const clients = await db.getAll("clients") as Client[];
      for (const c of clients) await sbSaveClient(userEmail, c);

      setDetail("Migrating client tasks...");
      const clientTasks = await db.getAll("client-tasks") as ClientTask[];
      for (const t of clientTasks) await sbSaveClientTask(userEmail, t);

      setDetail("Migrating sessions...");
      const sessions = await db.getAll("client-sessions") as ClientSession[];
      for (const s of sessions) await sbSaveSession(userEmail, s);

      setStatus("done");
      setDetail(`Migrated ${tasks.length} tasks, ${clients.length} projects, ${goals.length} goals.`);
    } catch (e) {
      setStatus("error");
      setDetail(String(e));
    }
  };

  if (status === "done") {
    return (
      <div className="text-xs text-green-700 px-3 py-1.5 bg-green-50 border border-green-200 rounded-sm" style={{ fontFamily: "var(--font-body)" }}>
        ✓ Migration complete — {detail}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={migrate}
        disabled={status === "running"}
        className="text-xs px-3 py-1.5 text-white rounded-sm disabled:opacity-50 transition-opacity"
        style={{ backgroundColor: "#9b72cf", fontFamily: "var(--font-body)" }}
      >
        {status === "running" ? "Migrating..." : "↑ Migrate local data to cloud"}
      </button>
      {detail && status === "running" && (
        <p className="text-[10px] text-paper-ink-light" style={{ fontFamily: "var(--font-body)" }}>{detail}</p>
      )}
      {status === "error" && (
        <p className="text-[10px] text-red-500" style={{ fontFamily: "var(--font-body)" }}>{detail}</p>
      )}
    </div>
  );
}
