import { supabase } from "@/lib/supabase";
import type { BrainDump } from "@/types";

export async function sbGetBrainDump(userEmail: string, weekId: string): Promise<BrainDump | undefined> {
  const { data, error } = await supabase
    .from("braindumps")
    .select("*")
    .eq("user_email", userEmail)
    .eq("week_id", weekId)
    .maybeSingle();
  if (error) { console.error("[sb] getBrainDump:", error); throw error; }
  if (!data) return undefined;
  return { weekId: data.week_id, text: data.text, updatedAt: data.updated_at };
}

export async function sbSaveBrainDump(userEmail: string, dump: BrainDump): Promise<void> {
  const { error } = await supabase.from("braindumps").upsert({
    user_email: userEmail,
    week_id: dump.weekId,
    text: dump.text,
    updated_at: dump.updatedAt,
  });
  if (error) console.error("[sb] saveBrainDump:", error);
}
