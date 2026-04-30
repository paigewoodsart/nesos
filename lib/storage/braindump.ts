import { getDb } from "./db";
import type { BrainDump } from "@/types";

export async function getBrainDump(weekId: string): Promise<BrainDump | undefined> {
  const db = await getDb();
  return db.get("braindumps", weekId);
}

export async function saveBrainDump(dump: BrainDump): Promise<void> {
  const db = await getDb();
  await db.put("braindumps", dump);
}
