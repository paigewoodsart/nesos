"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addMonths, subMonths } from "date-fns";
import { prevWeekId, nextWeekId, getWeekId, formatWeekRange } from "@/lib/dates";
import { useSession, signIn, signOut } from "next-auth/react";
import type { View } from "./ViewToggle";
import type { Theme } from "@/lib/theme";
import { THEME_LABELS, THEME_SWATCH_COLOR } from "@/lib/theme";

const THEMES: Theme[] = ["original", "neutral"];

interface WeekNavProps {
  weekId: string;
  view: View;
  onViewChange: (v: View) => void;
  activeDate: Date;
  onDayChange: (d: Date) => void;
  onToggleArchive: () => void;
  onOpenHandbook?: () => void;
  theme?: Theme;
  onThemeChange?: (t: Theme) => void;
  onApplyNeutralColors?: () => void;
}

function UserMenu({ session, theme, onThemeChange, onApplyNeutralColors }: {
  session: NonNullable<ReturnType<typeof useSession>["data"]>;
  theme?: Theme;
  onThemeChange?: (t: Theme) => void;
  onApplyNeutralColors?: () => void;
}) {
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
        <svg width="18" height="4" viewBox="0 0 18 4" fill="none">
          <circle cx="2" cy="2" r="2" fill="rgba(26,26,26,0.28)"/>
          <circle cx="9" cy="2" r="2" fill="rgba(26,26,26,0.28)"/>
          <circle cx="16" cy="2" r="2" fill="rgba(26,26,26,0.28)"/>
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

            {/* Board palette */}
            {onThemeChange && (
              <div className="px-4 py-3 border-b border-paper-line/30">
                <p className="text-[10px] uppercase tracking-[0.18em] text-paper-ink-light mb-2" style={{ fontFamily: "var(--font-body)" }}>Board palette</p>
                <div className="flex items-center gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t}
                      onClick={() => onThemeChange(t)}
                      title={THEME_LABELS[t]}
                      aria-label={`Switch to ${THEME_LABELS[t]} theme`}
                      className="flex items-center gap-1.5 transition-opacity hover:opacity-100"
                      style={{ opacity: theme === t ? 1 : 0.45 }}
                    >
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0 transition-transform"
                        style={{
                          backgroundColor: THEME_SWATCH_COLOR[t],
                          boxShadow: theme === t ? "0 0 0 2px rgba(26,26,26,0.4)" : "0 0 0 1px rgba(26,26,26,0.15)",
                          transform: theme === t ? "scale(1.2)" : "scale(1)",
                          display: "inline-block",
                        }}
                      />
                      <span className="text-xs text-paper-ink" style={{ fontFamily: "var(--font-body)" }}>{THEME_LABELS[t]}</span>
                    </button>
                  ))}
                </div>
                {onApplyNeutralColors && (
                  <button
                    onClick={() => { onApplyNeutralColors(); setOpen(false); }}
                    className="mt-2 text-[10px] tracking-wide text-paper-ink-light hover:text-paper-ink transition-colors"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    apply to panels
                  </button>
                )}
              </div>
            )}

            {/* Privacy policy */}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-4 py-2.5 text-sm text-paper-ink-light hover:bg-paper-warm transition-colors border-b border-paper-line/30"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Privacy Policy
            </a>

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
            <div className="px-4 py-3 border-t border-paper-line/30">
              <p className="text-[10px] text-paper-ink-light" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
                made with love by Paige Woods
              </p>
            </div>
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

export function WeekNav({ weekId, view, onViewChange, activeDate, onDayChange, onToggleArchive, onOpenHandbook, theme = "original", onThemeChange, onApplyNeutralColors }: WeekNavProps) {
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
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 border-b"
      style={{
        backgroundColor: "rgba(255,255,255,0.08)",
        borderColor: "rgba(255,255,255,0.18)",
        backdropFilter: "blur(18px) saturate(160%)",
        WebkitBackdropFilter: "blur(18px) saturate(160%)",
      }}
    >

      {/* Left: logo + title */}
      <div className="flex items-center gap-3">
        <img src="/nesos-icon.webp" alt="Nesos" className="h-8 w-8 object-contain" />
        <div className="flex flex-col leading-none">
          <h1
            className="text-xl font-bold tracking-tight leading-none"
            style={{ fontFamily: "var(--font-aboreto)", color: "var(--color-paper-rust)", textShadow: "0 1px 3px rgba(249,248,246,0.8)" }}
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

        {/* Handbook */}
        {onOpenHandbook && (
          <button
            onClick={onOpenHandbook}
            title="How to use Nesos"
            className="flex items-center justify-center w-8 h-8 text-paper-ink-light hover:text-paper-ink transition-colors text-sm font-medium"
            aria-label="How to use Nesos"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            ?
          </button>
        )}

        {/* Archive */}
        <button
          onClick={onToggleArchive}
          title="Archive"
          className="flex items-center justify-center w-8 h-8 text-paper-ink-light hover:text-paper-ink transition-colors"
          aria-label="Archive"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="14" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M2 5v9a1 1 0 001 1h10a1 1 0 001-1V5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M6 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Spotify brain music */}
        <a
          href="https://open.spotify.com/playlist/1DS3PGYtl7dV8YGTXfbPRt"
          target="_blank"
          rel="noopener noreferrer"
          title="brain music"
          className="flex items-center justify-center w-8 h-8"
          aria-label="Brain music playlist"
        >
          <img src="/spotify-logo.webp" alt="Spotify" className="w-5 h-5 object-contain opacity-60 hover:opacity-100 transition-opacity" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" }} />
        </a>

        {/* Sign in (not authenticated) */}
        {!session && (
          <button
            onClick={() => signIn("google")}
            className="relative overflow-hidden text-[11px] px-4 py-1.5 font-semibold tracking-[0.12em] uppercase transition-opacity hover:opacity-80"
            style={{
              fontFamily: "var(--font-body)",
              color: "rgba(26,26,26,0.78)",
              borderRadius: "2px",
              boxShadow: "0 2px 6px rgba(26,26,26,0.14), 0 1px 2px rgba(26,26,26,0.08)",
            }}
          >
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: "url('/gradient-nesos.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: 0.5,
              }}
            />
            <span className="relative">Sign in</span>
          </button>
        )}

        {/* Three-dot menu (authenticated) */}
        {session && <UserMenu session={session} theme={theme} onThemeChange={onThemeChange} onApplyNeutralColors={onApplyNeutralColors} />}

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
