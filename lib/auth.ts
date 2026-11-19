import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";

// Apple returns to the callback with a cross-site form POST, which drops
// SameSite=Lax cookies. The OAuth check cookies need SameSite=None in
// production or Apple sign-in fails with a "could not be parsed" error.
const isProd = process.env.NODE_ENV === "production";
const crossSite = { httpOnly: true, sameSite: "none" as const, path: "/", secure: true };
const oauthCookies = isProd
  ? {
      pkceCodeVerifier: { name: "__Secure-authjs.pkce.code_verifier", options: crossSite },
      state: { name: "__Secure-authjs.state", options: crossSite },
      nonce: { name: "__Secure-authjs.nonce", options: crossSite },
      // Remembers where to go after sign-in (the app's hand-off page). Without
      // this, Apple sign-in forgets it and lands on the website instead.
      callbackUrl: { name: "__Secure-authjs.callback-url", options: crossSite },
    }
  : undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  cookies: oauthCookies,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Always show Google's "choose an account" screen, so sign-in never
      // completes silently and people with two accounts can pick one.
      authorization: { params: { prompt: "select_account" } },
    }),
    // Only enabled once the Apple env vars exist, so deploying this before
    // the Apple setup is finished can't break Google sign-in.
    ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
      ? [
          Apple({
            clientId: process.env.APPLE_CLIENT_ID,
            clientSecret: process.env.APPLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      // Apple: prefer real email when user chose "Share My Email"
      if (account?.provider === "apple" && profile?.email) {
        token.email = profile.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}
