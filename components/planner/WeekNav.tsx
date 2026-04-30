"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addMonths, subMonths } from "date-fns";
import { prevWeekId, nextWeekId, getWeekId, formatWeekRange } from "@/lib/dates";
import { MigrateDataButton } from "./MigrateDataButton";
import { ViewToggle } from "./ViewToggle";
import { useSession, signIn, signOut } from "next-auth/react";
import type { View } from "./ViewToggle";
import type { BloomState } from "@/types";

interface WeekNavProps {
  weekId: string;
  bloomState: BloomState;
  view: View;
  onViewChange: (v: View) => void;
  activeDate: Date;
  onDayChange: (d: Date) => void;
}

function UserMenu({ session }: { session: NonNullable<ReturnType<typeof useSession>["data"]> }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const email = session.user?.email ?? "";
  const name = session.user?.name?.split(" ")[0] ?? email;

  const handleDelete = async () => {
    if (!confirm("This will permanently delete all your Nesos data. This cannot be undone. Are you sure?")) return;
    setDeleting(true);
    try {
      await fetch("/api/account/delete", { method: "DELETE" });
      await signOut();
    } catch {
      setDeleting(false);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 flex items-center justify-center text-paper-ink-light hover:text-paper-ink transition-colors"
        aria-label="Account menu"
      >
        <svg width="16" height="4" viewBox="0 0 16 4" fill="none">
          <circle cx="2" cy="2" r="1.5" fill="currentColor"/>
          <circle cx="8" cy="2" r="1.5" fill="currentColor"/>
          <circle cx="14" cy="2" r="1.5" fill="currentColor"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-10 z-50 w-56 shadow-lg animate-fade-up"
            style={{
              backgroundColor: "rgba(255,255,255,0.97)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(26,26,26,0.08)",
              boxShadow: "0 8px 32px rgba(26,26,26,0.12)",
            }}
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-paper-line/30">
              <p className="text-sm font-semibold text-paper-ink" style={{ fontFamily: "var(--font-serif)" }}>{name}</p>
              <p className="text-[10px] text-paper-ink-light truncate" style={{ fontFamily: "var(--font-body)" }}>{email}</p>
            </div>

            {/* Migrate */}
            <div className="px-4 py-2 border-b border-paper-line/30">
              <MigrateDataButton userEmail={email} />
            </div>

            {/* Sign out */}
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="w-full text-left px-4 py-2.5 text-sm text-paper-ink hover:bg-paper-warm transition-colors"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Sign out
            </button>

            {/* Delete account */}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-paper-line/30 disabled:opacity-40"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {deleting ? "Deleting..." : "Delete account"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function NesosPhonetic() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative mt-0.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] tracking-widest text-paper-ink-light hover:text-paper-ink transition-colors select-none"
        style={{ fontFamily: "var(--font-body)", letterSpacing: "0.18em" }}
      >
        νῆσος · nē·sos
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-6 z-50 w-56 rounded-sm shadow-lg px-4 py-3 animate-fade-up"
            style={{
              backgroundColor: "rgba(255,255,255,0.96)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(26,26,26,0.08)",
              boxShadow: "0 8px 32px rgba(26,26,26,0.12)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-paper-ink-light mb-1" style={{ fontFamily: "var(--font-body)" }}>
              ancient greek
            </p>
            <p className="text-xl font-semibold text-paper-ink mb-0.5" style={{ fontFamily: "var(--font-serif)" }}>
              island
            </p>
            <p className="text-[11px] leading-relaxed text-paper-ink-light italic mt-2" style={{ fontFamily: "var(--font-serif)" }}>
              where scattered thoughts find shore.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export function WeekNav({ weekId, bloomState: _bloomState, view, onViewChange, activeDate, onDayChange }: WeekNavProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isCurrentWeek = weekId === getWeekId(new Date());

  const handlePrev = () => {
    if (view === "month") onDayChange(subMonths(activeDate, 1));
    else router.push(`/planner/${prevWeekId(weekId)}`);
  };

  const handleNext = () => {
    if (view === "month") onDayChange(addMonths(activeDate, 1));
    else router.push(`/planner/${nextWeekId(weekId)}`);
  };

  const handleToday = () => {
    const today = new Date();
    onDayChange(today);
    router.push(`/planner/${getWeekId(today)}`);
  };

  const showNav = view !== "board";
  const navLabel = view === "month"
    ? format(activeDate, "MMMM yyyy")
    : formatWeekRange(weekId);
  const isCurrentPeriod = view === "month"
    ? format(activeDate, "yyyy-MM") === format(new Date(), "yyyy-MM")
    : isCurrentWeek;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 border-b-2 border-paper-ink/10 bg-paper-cream/98 backdrop-blur-sm">

      {/* Left: logo + title */}
      <div className="flex items-center gap-3">
        <img src="/nesos-icon.webp" alt="Nesos" className="h-8 w-8 object-contain" />
        <div className="flex flex-col leading-none">
          <h1
            className="text-xl font-bold tracking-tight leading-none"
            style={{ fontFamily: "var(--font-aboreto)", color: "var(--color-paper-rust)" }}
          >
            Nesos
          </h1>
          <NesosPhonetic />
        </div>
        {showNav && (
          <>
            <span className="text-paper-line text-xl font-thin">|</span>
            <span className="text-sm text-paper-ink-light italic font-medium" style={{ fontFamily: "var(--font-serif)" }}>
              {navLabel}
            </span>
          </>
        )}
      </div>

      {/* Right: sign in / menu → view toggle → nav arrows */}
      <div className="flex items-center gap-4">

        {/* Sign in (not authenticated) */}
        {!session && (
          <button
            onClick={() => signIn("google")}
            className="text-xs px-3 py-1.5 border border-paper-ink/20 text-paper-ink hover:bg-paper-ink hover:text-white transition-all"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Sign in
          </button>
        )}

        {/* Three-dot menu (authenticated) */}
        {session && <UserMenu session={session} />}

        <ViewToggle view={view} onChange={onViewChange} />

        {showNav && (
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-paper-warm text-paper-ink-light hover:text-paper-ink transition-all text-base font-medium"
              aria-label="Previous"
            >
              ←
            </button>
            {!isCurrentPeriod && (
              <button
                onClick={handleToday}
                className="text-xs px-3 py-1.5 rounded-full border-2 border-paper-rust text-paper-rust hover:bg-paper-rust hover:text-white transition-all font-medium"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Today
              </button>
            )}
            <button
              onClick={handleNext}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-paper-warm text-paper-ink-light hover:text-paper-ink transition-all text-base font-medium"
              aria-label="Next"
            >
              →
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
