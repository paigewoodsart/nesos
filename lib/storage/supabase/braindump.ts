import type { BrainDump } from "@/types";

export async function sbGetBrainDump(_userEmail: string, weekId: string): Promise<BrainDump | undefined> {
  const res = await fetch(`/api/db/braindump?weekId=${encodeURIComponent(weekId)}`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  if (!data) return undefined;
  return { weekId: data.week_id, text: data.text, updatedAt: data.updated_at };
}

export async function sbSaveBrainDump(_userEmail: string, dump: BrainDump): Promise<void> {
  const res = await fetch("/api/db/braindump", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dump) });
  if (!res.ok) console.error("[sb] saveBrainDump:", await res.text());
}
