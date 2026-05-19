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
  const { data, error } = await supabase.from("braindumps").select("*").eq("user_email", email).eq("week_id", weekId).maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const email = await getEmail(req);
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServerClient();
  const dump = await req.json();
  const { error } = await supabase.from("braindumps").upsert({
    user_email: email, week_id: dump.weekId, text: dump.text, updated_at: dump.updatedAt,
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
