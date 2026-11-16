import { getToken } from "next-auth/jwt";
import { jwtVerify } from "jose";
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
const secureCookie = process.env.NODE_ENV === "production";

/**
 * Extract the authenticated user's email from a request.
 * Checks for a Bearer token first (native app), then falls back to the
 * NextAuth session cookie (web). Returns null if unauthenticated.
 */
export async function getEmail(req: NextRequest): Promise<string | null> {
  // 1. Try Bearer token (native app)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const jwt = authHeader.slice(7);
    const email = await verifyBearerToken(jwt);
    return email;
  }

  // 2. Fall back to NextAuth session cookie (web)
  const token = await getToken({ req, secret, secureCookie });
  return (token?.email as string) ?? null;
}

async function verifyBearerToken(jwt: string): Promise<string | null> {
  if (!secret) return null;
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(jwt, key, { algorithms: ["HS256"] });
    const email = payload.email as string | undefined;
    if (!email) return null;

    // Check if tokens were revoked (account deletion)
    const supabase = createServerClient();
    const { data } = await supabase
      .from("token_revocations")
      .select("revoked_at")
      .eq("user_email", email)
      .single();

    if (data?.revoked_at) {
      const revokedAt = Math.floor(new Date(data.revoked_at).getTime() / 1000);
      const issuedAt = payload.iat ?? 0;
      if (issuedAt <= revokedAt) return null;
    }

    return email;
  } catch {
    return null;
  }
}
