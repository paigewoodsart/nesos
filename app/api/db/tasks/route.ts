import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);

  if (searchParams.get("recurring") === "true") {
    const { data, error } = await supabase.from("tasks").select("*").eq("user_email", email).eq("recurring", true);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data);
  }

  const weekId = searchParams.get("weekId");
  if (!weekId) return Response.json({ error: "weekId required" }, { status: 400 });
  const { data, error } = await supabase.from("tasks").select("*").eq("user_email", email).eq("week_id", weekId);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const supabase = createServerClient();
  const task = await req.json();

  const { error } = await supabase.from("tasks").upsert({
    id: task.id,
    user_email: email,
    week_id: task.weekId,
    day_index: task.dayIndex,
    text: task.text,
    completed: task.completed,
    sort_order: task.sortOrder,
    start_minute: task.startMinute,
    end_minute: task.endMinute,
    recurring: task.recurring,
    recurring_pattern: task.recurringPattern,
    created_at: task.createdAt,
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const supabase = createServerClient();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_email", email);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
