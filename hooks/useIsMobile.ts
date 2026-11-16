"use client";

import { useState, useEffect } from "react";

// Set only by the Nesos Mac/iPad app (via /api/auth/mobile-session?desktop=1
// or cookie injection). Forces the desktop layout regardless of width.
function isForcedDesktop(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c === "nesos-desktop=1");
}

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Initial state is already false, so just skip the width listener.
    if (isForcedDesktop()) return;
    const mq = window.matchMedia("(max-width: 900px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
