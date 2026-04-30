"use client";

interface MobileScreenHeaderProps {
  title: string;
  onBack: () => void;
  onOpenDrawer: () => void;
  accent?: string;
}

export function MobileScreenHeader({ title, onBack, onOpenDrawer, accent }: MobileScreenHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2 py-3 border-b border-paper-line bg-paper-cream/95 backdrop-blur-sm flex-shrink-0">
      <button onClick={onBack} className="w-11 h-11 flex items-center justify-center text-paper-ink-light hover:text-paper-ink text-xl" aria-label="Back">
        ←
      </button>
      <h2
        className="text-base font-semibold text-paper-ink"
        style={{ fontFamily: "var(--font-serif)", color: accent }}
      >
        {title}
      </h2>
      <button onClick={onOpenDrawer} className="w-11 h-11 flex items-center justify-center text-paper-ink-light hover:text-paper-ink" aria-label="Menu">
        <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
          <path d="M0 1h20M0 8h20M0 15h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
