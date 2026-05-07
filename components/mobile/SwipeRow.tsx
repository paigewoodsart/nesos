"use client";

import { useRef, useState } from "react";

interface SwipeRowProps {
  onArchive?: () => void;
  onDelete?: () => void;
  archiveColor?: string;
  children: React.ReactNode;
}

const THRESHOLD = 72;
const MAX_DRAG = 108;

function ArchiveSvg() {
  return (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="14" height="4" rx="1" stroke="white" strokeWidth="1.4"/>
      <path d="M2 5v9a1 1 0 001 1h10a1 1 0 001-1V5" stroke="white" strokeWidth="1.4"/>
      <path d="M6 8h4" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function TrashSvg() {
  return (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"
        stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function SwipeRow({ onArchive, onDelete, archiveColor = "#52b69a", children }: SwipeRowProps) {
  const [x, setX] = useState(0);
  const [springing, setSpringing] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef<"h" | "v" | null>(null);
  const active = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    locked.current = null;
    active.current = true;
    setSpringing(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!active.current) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (!locked.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      locked.current = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
      if (locked.current === "v") { active.current = false; return; }
    }
    if (locked.current !== "h") return;

    if (dx > 0 && !onArchive) return;
    if (dx < 0 && !onDelete) return;

    e.preventDefault();
    const clamped = Math.sign(dx) * Math.min(Math.abs(dx), MAX_DRAG);
    setX(clamped);
  };

  const onTouchEnd = () => {
    if (!active.current) return;
    active.current = false;
    setSpringing(true);

    if (x >= THRESHOLD && onArchive) {
      setX(0);
      onArchive();
    } else if (x <= -THRESHOLD && onDelete) {
      setX(0);
      onDelete();
    } else {
      setX(0);
    }
  };

  const archiveReveal = Math.min(x / THRESHOLD, 1);
  const deleteReveal = Math.min(-x / THRESHOLD, 1);

  return (
    <div className="relative overflow-hidden" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {/* Archive backing (right swipe) */}
      {onArchive && (
        <div
          className="absolute inset-0 flex items-center pl-5"
          style={{ backgroundColor: archiveColor, opacity: archiveReveal }}
        >
          <ArchiveSvg />
        </div>
      )}
      {/* Delete backing (left swipe) */}
      {onDelete && (
        <div
          className="absolute inset-0 flex items-center justify-end pr-5"
          style={{ backgroundColor: "#ef4444", opacity: deleteReveal }}
        >
          <TrashSvg />
        </div>
      )}
      {/* Sliding content */}
      <div
        style={{
          transform: `translateX(${x}px)`,
          transition: springing && x === 0 ? "transform 0.22s ease-out" : "none",
        }}
        onTransitionEnd={() => setSpringing(false)}
      >
        {children}
      </div>
    </div>
  );
}
