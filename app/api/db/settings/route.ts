import { NextRequest } from "next/server";
import { getEmail } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";

// Per-account appearance settings, so the theme follows the user between the
// website and the apps (it used to live only in one browser's localStorage).
export async function GET(req: NextRequest) {
  const email = await getEmail(req);
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServerClient();
  const { data, error } = await supabase.from("user_settings").select("*").eq("user_email", email).maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ? {
    theme: data.theme ?? null,
    customColor: data.custom_color ?? null,
    staticBackground: data.static_background ?? null,
  } : {});
}

export async function POST(req: NextRequest) {
  const email = await getEmail(req);
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServerClient();
  const body = await req.json();
  const row: Record<string, unknown> = { user_email: email, updated_at: new Date().toISOString() };
  if (typeof body.theme === "string") row.theme = body.theme;
  if (typeof body.customColor === "string") row.custom_color = body.customColor;
  if (typeof body.staticBackground === "boolean") row.static_background = body.staticBackground;
  const { error } = await supabase.from("user_settings").upsert(row);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
