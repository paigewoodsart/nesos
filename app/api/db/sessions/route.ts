import { getToken } from "next-auth/jwt";
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

async function getEmail(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req, secret });
  return (token?.email as string) ?? null;
}

export async function GET(req: NextRequest) {
  const email = await getEmail(req);
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServerClient();
  const weekId = new URL(req.url).searchParams.get("weekId");
  if (!weekId) return Response.json({ error: "weekId required" }, { status: 400 });
  const { data, error } = await supabase.from("client_sessions").select("*").eq("user_email", email).eq("week_id", weekId);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const email = await getEmail(req);
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServerClient();
  const s = await req.json();
  const { error } = await supabase.from("client_sessions").upsert({
    id: s.id, user_email: email, client_id: s.clientId, week_id: s.weekId,
    day_index: s.dayIndex, start_minute: s.startMinute, end_minute: s.endMinute,
    actual_minutes: s.actualMinutes, notes: s.notes, date: s.date, created_at: s.createdAt,
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
  const { error } = await supabase.from("client_sessions").delete().eq("id", id).eq("user_email", email);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
