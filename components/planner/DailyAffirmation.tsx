"use client";

import { useEffect, useState } from "react";

const CACHE_VERSION = "v2";

function todayKey() {
  const d = new Date();
  return `affirmation-${CACHE_VERSION}-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

interface AffirmationData {
  quote: string;
  byline: string;
}

export function DailyAffirmation({ color = "#F7C948" }: { color?: string }) {
  const [data, setData] = useState<AffirmationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const key = todayKey();
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
        return;
      }
    } catch {}

    fetch("/api/ai/affirmation", { method: "POST" })
      .then((r) => r.json())
      .then((d: AffirmationData) => {
        setData(d);
        try { localStorage.setItem(todayKey(), JSON.stringify(d)); } catch {}
      })
      .catch(() => setData({ quote: "Every experience you have is literally changing your brain.", byline: "— Norman Doidge" }))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async () => {
    if (!data) return;
    const text = data.byline ? `"${data.quote}" ${data.byline}` : data.quote;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  if (loading) {
    return (
      <p className="text-xs animate-pulse-soft text-paper-ink-light" style={{ fontFamily: "var(--font-body)" }}>
        …
      </p>
    );
  }

  return (
    <div
      onClick={handleCopy}
      className="relative cursor-pointer select-none group"
      style={{ border: `5px solid ${color}`, padding: "14px 16px" }}
      title="Click to copy"
    >
      {/* Copy feedback */}
      <span
        className="absolute top-2 right-2.5 text-[10px] uppercase tracking-widest transition-opacity duration-300"
        style={{
          fontFamily: "var(--font-body)",
          color: color,
          opacity: copied ? 1 : 0,
        }}
      >
        Copied
      </span>

      <p
        className="text-sm leading-relaxed text-paper-ink mb-3"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {data?.quote}
      </p>

      {data?.byline && (
        <p
          className="text-[11px] text-paper-ink-light tracking-wide"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {data.byline}
        </p>
      )}
    </div>
  );
}
