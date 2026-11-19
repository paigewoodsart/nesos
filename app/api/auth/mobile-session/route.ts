import { NextRequest, NextResponse } from "next/server";
import { encode } from "@auth/core/jwt";
import { createServerClient } from "@/lib/supabase-server";

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
const secureCookie = process.env.NODE_ENV === "production";
const cookieName = secureCookie
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

/**
 * The Mac/iPad WKWebView loads /api/auth/mobile-session?token=<one-time>&desktop=1
 * This consumes the one-time token, sets a normal Auth.js session cookie
 * in the webview, and (with desktop=1) the nesos-desktop cookie that forces
 * the desktop layout. Then it redirects to the planner.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token || !secret) {
    return new Response("Missing token", { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("mobile_session_tokens")
    .select("user_email, payload, expires_at")
    .eq("token", token)
    .single();

  if (error || !data) {
    return new Response("Invalid or expired token", { status: 401 });
  }

  // One-time use
  await supabase.from("mobile_session_tokens").delete().eq("token", token);

  if (new Date(data.expires_at) < new Date()) {
    return new Response("Token expired", { status: 401 });
  }

  const payload = (data.payload as Record<string, unknown> | null) ?? {};
  const sessionJwt = await encode({
    token: { ...payload, email: data.user_email, sub: (payload.sub as string) ?? data.user_email },
    secret,
    salt: cookieName,
    maxAge: SESSION_MAX_AGE,
  });

  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set(cookieName, sessionJwt, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  if (req.nextUrl.searchParams.get("desktop") === "1") {
    res.cookies.set("nesos-desktop", "1", {
      secure: secureCookie,
      sameSite: "lax",
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    });
  }
  return res;
}
