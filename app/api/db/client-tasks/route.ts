import { getEmail } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const email = await getEmail(req);
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServerClient();
  const params = new URL(req.url).searchParams;
  // all=1: every not-yet-archived task across all projects (iPhone home + Due page)
  if (params.get("all") === "1") {
    const { data, error } = await supabase.from("client_tasks").select("*").eq("user_email", email).or("archived.is.null,archived.eq.false");
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data);
  }
  const clientId = params.get("clientId");
  if (!clientId) return Response.json({ error: "clientId required" }, { status: 400 });
  const { data, error } = await supabase.from("client_tasks").select("*").eq("user_email", email).eq("client_id", clientId);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const email = await getEmail(req);
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServerClient();
  const task = await req.json();
  const { error } = await supabase.from("client_tasks").upsert({
    id: task.id, user_email: email, client_id: task.clientId, text: task.text,
    done: task.done, done_at: task.doneAt, due_date: task.dueDate,
    archived: task.archived, archived_at: task.archivedAt, created_at: task.createdAt,
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const email = await getEmail(req);
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServerClient();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const { error } = await supabase.from("client_tasks").delete().eq("id", id).eq("user_email", email);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
