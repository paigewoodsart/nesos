import { signIn } from "@/lib/auth";
import { NextRequest } from "next/server";

/**
 * Entry point for native sign-in. The app opens this URL in
 * ASWebAuthenticationSession: /api/auth/mobile-start?provider=google|apple
 * Auth.js v5 needs a server-side signIn() call (with CSRF handled for us),
 * so a plain GET to /api/auth/signin/<provider> is not enough.
 */
export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider");
  if (provider !== "google" && provider !== "apple") {
    return new Response("Unknown provider", { status: 400 });
  }
  // Throws a redirect to the provider; after OAuth, Auth.js sends the
  // browser to /api/auth/mobile-callback, which hands tokens to the app.
  await signIn(provider, { redirectTo: "/api/auth/mobile-callback" });
}
