import { NextRequest } from "next/server";
import { encode } from "@auth/core/jwt";
import { createServerClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
const secureCookie = process.env.NODE_ENV === "production";
const cookieName = secureCookie
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token || !secret) {
    return new Response("Missing token", { status: 400 });
  }

  // Verify and consume the one-time session token
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("mobile_session_tokens")
    .select("user_email, expires_at")
    .eq("token", token)
    .single();

  if (error || !data) {
    return new Response("Invalid or expired token", { status: 401 });
  }

  // Delete immediately (one-time use)
  await supabase.from("mobile_session_tokens").delete().eq("token", token);

  if (new Date(data.expires_at) < new Date()) {
    return new Response("Token expired", { status: 401 });
  }

  const email = data.user_email;

  // Use Auth.js encode to mint a proper encrypted session JWT
  const sessionJwt = await encode({
    token: { email, sub: email },
    secret,
    salt: cookieName,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  const cookieStore = await cookies();
  cookieStore.set(cookieName, sessionJwt, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return Response.redirect(new URL("/", req.url));
}
