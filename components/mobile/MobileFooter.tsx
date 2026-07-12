"use client";

export function MobileFooter() {
  return (
    <div className="flex-shrink-0 border-t border-paper-line/20 bg-paper-cream/90 backdrop-blur-sm py-1.5 flex items-center justify-center gap-3">
      <span className="text-[10px] text-paper-ink-light" style={{ fontFamily: "var(--font-body)" }}>
        beta -{" "}
        <a href="mailto:nesosplanner@gmail.com" className="underline underline-offset-2">
          nesosplanner@gmail.com
        </a>
      </span>
      <span className="text-[10px] text-paper-ink-light/40">·</span>
      <a
        href="/privacy"
        className="text-[10px] text-paper-ink-light underline underline-offset-2"
        style={{ fontFamily: "var(--font-body)" }}
      >
        Privacy Policy
      </a>
    </div>
  );
}
