import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const supabase = createServerClient();
  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!clientId) return Response.json({ error: "clientId required" }, { status: 400 });
  const { data, error } = await supabase.from("client_tasks").select("*").eq("user_email", email).eq("client_id", clientId);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const supabase = createServerClient();
  const task = await req.json();

  const { error } = await supabase.from("client_tasks").upsert({
    id: task.id,
    user_email: email,
    client_id: task.clientId,
    text: task.text,
    done: task.done,
    done_at: task.doneAt,
    due_date: task.dueDate,
    archived: task.archived,
    archived_at: task.archivedAt,
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
  const { error } = await supabase.from("client_tasks").delete().eq("id", id).eq("user_email", email);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
