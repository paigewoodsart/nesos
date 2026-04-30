import { supabase } from "@/lib/supabase";
import type { Goal } from "@/types";

export async function sbGetGoalsByWeek(userEmail: string, weekId: string): Promise<Goal[]> {
  const { data } = await supabase
    .from("goals")
    .select("*")
    .eq("user_email", userEmail)
    .eq("week_id", weekId)
    .eq("type", "weekly");
  return (data ?? []).map(rowToGoal);
}

export async function sbGetLongtermGoals(userEmail: string): Promise<Goal[]> {
  const { data } = await supabase
    .from("goals")
    .select("*")
    .eq("user_email", userEmail)
    .eq("type", "longterm");
  return (data ?? []).map(rowToGoal);
}

export async function sbSaveGoal(userEmail: string, goal: Goal): Promise<void> {
  await supabase.from("goals").upsert({
    id: goal.id,
    user_email: userEmail,
    week_id: goal.weekId,
    text: goal.text,
    completed: goal.completed,
    type: goal.type,
    created_at: goal.createdAt,
  });
}

export async function sbDeleteGoal(id: string): Promise<void> {
  await supabase.from("goals").delete().eq("id", id);
}

function rowToGoal(r: Record<string, unknown>): Goal {
  return {
    id: r.id as string,
    weekId: r.week_id as string | null,
    text: r.text as string,
    completed: r.completed as boolean,
    type: r.type as "weekly" | "longterm",
    createdAt: r.created_at as number,
  };
}
