import { getToken } from "next-auth/jwt";
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
const secureCookie = process.env.NODE_ENV === "production";

async function getEmail(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req, secret, secureCookie });
  return (token?.email as string) ?? null;
}

export async function GET(req: NextRequest) {
  const email = await getEmail(req);
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type === "longterm") {
    const { data, error } = await supabase.from("goals").select("*").eq("user_email", email).eq("type", "longterm");
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data);
  }

  const weekId = searchParams.get("weekId");
  if (!weekId) return Response.json({ error: "weekId required" }, { status: 400 });
  const { data, error } = await supabase.from("goals").select("*").eq("user_email", email).eq("week_id", weekId).eq("type", "weekly");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const email = await getEmail(req);
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServerClient();
  const goal = await req.json();
  const { error } = await supabase.from("goals").upsert({
    id: goal.id, user_email: email, week_id: goal.weekId,
    text: goal.text, completed: goal.completed, type: goal.type, created_at: goal.createdAt,
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
  const { error } = await supabase.from("goals").delete().eq("id", id).eq("user_email", email);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
