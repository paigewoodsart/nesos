import { api } from "./api";
import type { BrainDump } from "@/types";

export async function sbGetBrainDump(_userEmail: string, weekId: string): Promise<BrainDump | undefined> {
  const res = await api(`/api/db/braindump?weekId=${encodeURIComponent(weekId)}`);
  const data = await res.json();
  if (!data) return undefined;
  return { weekId: data.week_id, text: data.text, updatedAt: data.updated_at };
}

export async function sbSaveBrainDump(_userEmail: string, dump: BrainDump): Promise<void> {
  await api("/api/db/braindump", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dump) });
}
