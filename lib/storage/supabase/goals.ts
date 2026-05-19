import { supabase } from "@/lib/supabase";
import type { Goal } from "@/types";

export async function sbGetGoalsByWeek(userEmail: string, weekId: string): Promise<Goal[]> {
  try {
    const res = await fetch(`/api/db/goals?weekId=${encodeURIComponent(weekId)}&type=weekly`);
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()).map(rowToGoal);
  } catch {
    const { data } = await supabase.from("goals").select("*").eq("user_email", userEmail).eq("week_id", weekId).eq("type", "weekly");
    return (data ?? []).map(rowToGoal);
  }
}

export async function sbGetLongtermGoals(userEmail: string): Promise<Goal[]> {
  try {
    const res = await fetch("/api/db/goals?type=longterm");
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()).map(rowToGoal);
  } catch {
    const { data } = await supabase.from("goals").select("*").eq("user_email", userEmail).eq("type", "longterm");
    return (data ?? []).map(rowToGoal);
  }
}

export async function sbSaveGoal(userEmail: string, goal: Goal): Promise<void> {
  try {
    const res = await fetch("/api/db/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(goal) });
    if (!res.ok) throw new Error(await res.text());
  } catch {
    await supabase.from("goals").upsert({
      id: goal.id, user_email: userEmail, week_id: goal.weekId,
      text: goal.text, completed: goal.completed, type: goal.type, created_at: goal.createdAt,
    });
  }
}

export async function sbDeleteGoal(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/db/goals?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
  } catch {
    await supabase.from("goals").delete().eq("id", id);
  }
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
