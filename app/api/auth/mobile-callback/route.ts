import { auth } from "@/lib/auth";
import { SignJWT } from "jose";
import { createServerClient } from "@/lib/supabase-server";
import { randomBytes } from "crypto";

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email || !secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const key = new TextEncoder().encode(secret);

  // Mint a long-lived bearer token (90 days) for native API calls
  const bearerToken = await new SignJWT({
    email,
    name: session.user?.name ?? null,
    image: session.user?.image ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(key);

  // Mint a short-lived one-time token (60s) for WKWebView session injection
  const sessionToken = randomBytes(32).toString("hex");
  const supabase = createServerClient();
  await supabase.from("mobile_session_tokens").insert({
    token: sessionToken,
    user_email: email,
    expires_at: new Date(Date.now() + 60_000).toISOString(),
  });

  const params = new URLSearchParams({
    token: bearerToken,
    session_token: sessionToken,
  });

  return Response.redirect(`nesos://auth-callback?${params.toString()}`);
}
