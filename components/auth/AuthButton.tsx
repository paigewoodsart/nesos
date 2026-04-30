"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session) {
    return (
      <button
        onClick={() => signOut()}
        className="text-xs text-paper-ink-light hover:text-paper-rust transition-colors"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        Disconnect Calendar
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="text-xs px-3 py-1.5 rounded-full border border-paper-dust-blue text-paper-dust-blue hover:bg-paper-dust-blue hover:text-white transition-all"
      style={{ fontFamily: "var(--font-serif)" }}
    >
      Connect Google Calendar
    </button>
  );
}
