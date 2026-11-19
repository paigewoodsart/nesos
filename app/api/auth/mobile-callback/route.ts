import { getToken } from "next-auth/jwt";
import { SignJWT } from "jose";
import { createServerClient } from "@/lib/supabase-server";
import { randomBytes } from "crypto";
import { NextRequest } from "next/server";

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
const secureCookie = process.env.NODE_ENV === "production";

export async function GET(req: NextRequest) {
  // Read the full Auth.js JWT (includes the Google access token used for
  // calendar), not just the session, so the webview session can carry it.
  const authToken = secret ? await getToken({ req, secret, secureCookie }) : null;
  const email = authToken?.email as string | undefined;
  if (!email || !secret || !authToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const key = new TextEncoder().encode(secret);

  // Long-lived bearer token (90 days) for native API calls
  const bearerToken = await new SignJWT({
    email,
    name: authToken.name ?? null,
    image: authToken.picture ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(key);

  // Short-lived one-time token (60s) for WKWebView session injection.
  // The full Auth.js token payload is stored server-side, never in the URL.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { iat, exp, jti, ...payload } = authToken as Record<string, unknown>;
  const sessionToken = randomBytes(32).toString("hex");
  const supabase = createServerClient();
  const { error } = await supabase.from("mobile_session_tokens").insert({
    token: sessionToken,
    user_email: email,
    payload,
    expires_at: new Date(Date.now() + 60_000).toISOString(),
  });
  if (error) {
    // Shows up in Vercel's logs, so the cause isn't a guess next time.
    console.error("mobile-callback: could not save session token:", error.message);
    return new Response("Could not start session", { status: 500 });
  }

  const params = new URLSearchParams({
    token: bearerToken,
    session_token: sessionToken,
  });

  return Response.redirect(`nesos://auth-callback?${params.toString()}`);
}
