import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const supabase = createServerClient();
  const weekId = new URL(req.url).searchParams.get("weekId");
  if (!weekId) return Response.json({ error: "weekId required" }, { status: 400 });
  const { data, error } = await supabase.from("braindumps").select("*").eq("user_email", email).eq("week_id", weekId).maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const supabase = createServerClient();
  const dump = await req.json();

  const { error } = await supabase.from("braindumps").upsert({
    user_email: email,
    week_id: dump.weekId,
    text: dump.text,
    updated_at: dump.updatedAt,
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
