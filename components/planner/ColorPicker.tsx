"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

// ── Color math ────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").padEnd(6, "0");
  const n = parseInt(clean.slice(0, 6), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, "0"))
      .join("")
  );
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const v = max;
  const s = max === 0 ? 0 : (max - min) / max;
  let h = 0;
  if (max !== min) {
    if (max === r) h = ((g - b) / (max - min)) % 6;
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    h = ((h * 60) + 360) % 360;
  }
  return [h, s, v];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

// ── Canvas drawing ────────────────────────────────────────────────

const SQ = 168;
const HUE_W = 16;
const HUE_H = 168;

function drawSquare(canvas: HTMLCanvasElement, hue: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const [r, g, b] = hsvToRgb(hue, 1, 1);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, SQ, SQ);
  const wGrad = ctx.createLinearGradient(0, 0, SQ, 0);
  wGrad.addColorStop(0, "rgba(255,255,255,1)");
  wGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = wGrad;
  ctx.fillRect(0, 0, SQ, SQ);
  const bGrad = ctx.createLinearGradient(0, 0, 0, SQ);
  bGrad.addColorStop(0, "rgba(0,0,0,0)");
  bGrad.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = bGrad;
  ctx.fillRect(0, 0, SQ, SQ);
}

function drawHueBar(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const grad = ctx.createLinearGradient(0, 0, 0, HUE_H);
  [0, 60, 120, 180, 240, 300, 360].forEach((h) => {
    const [r, g, b] = hsvToRgb(h, 1, 1);
    grad.addColorStop(h / 360, `rgb(${r},${g},${b})`);
  });
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, HUE_W, HUE_H);
}

// ── Spectrum popup (portalled) ─────────────────────────────────────

function SpectrumPopup({
  value,
  onChange,
  onClose,
  anchorRef,
}: {
  value: string;
  onChange: (hex: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const sqRef = useRef<HTMLCanvasElement>(null);
  const hueRef = useRef<HTMLCanvasElement>(null);
  const draggingSq = useRef(false);
  const draggingHue = useRef(false);

  const init = rgbToHsv(...hexToRgb(value));
  const [hsv, setHsv] = useState<[number, number, number]>(init);
  const [hexInput, setHexInput] = useState(value);
  const [hh, hs, hv] = hsv;

  // Popup position
  const getRect = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return { top: 100, left: 100 };
    const rect = anchor.getBoundingClientRect();
    const popupH = 310, popupW = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > popupH + 8 ? rect.bottom + 8 : rect.top - popupH - 8;
    const left = Math.min(Math.max(rect.left - 8, 8), window.innerWidth - popupW - 8);
    return { top, left };
  }, [anchorRef]);

  const pos = getRect();

  // Draw canvases
  useLayoutEffect(() => {
    if (sqRef.current) drawSquare(sqRef.current, hh);
  }, [hh]);

  useLayoutEffect(() => {
    if (hueRef.current) drawHueBar(hueRef.current);
  }, []);

  // Sync on external value change
  useEffect(() => {
    const newHsv = rgbToHsv(...hexToRgb(value));
    setHsv(newHsv);
    setHexInput(value);
  }, [value]);

  // Global drag listeners
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (draggingSq.current) pickSq(e.clientX, e.clientY);
      if (draggingHue.current) pickHue(e.clientY);
    };
    const onUp = () => { draggingSq.current = false; draggingHue.current = false; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hh, hs, hv]);

  const pickSq = useCallback((clientX: number, clientY: number) => {
    const canvas = sqRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const s = Math.max(0, Math.min((clientX - rect.left) / rect.width, 1));
    const v = Math.max(0, Math.min(1 - (clientY - rect.top) / rect.height, 1));
    setHsv((prev) => [prev[0], s, v]);
    const hex = rgbToHex(...hsvToRgb(hh, s, v));
    setHexInput(hex);
    onChange(hex);
  }, [hh, onChange]);

  const pickHue = useCallback((clientY: number) => {
    const canvas = hueRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const h = Math.max(0, Math.min((clientY - rect.top) / rect.height, 1)) * 360;
    setHsv([h, hs, hv]);
    const hex = rgbToHex(...hsvToRgb(h, hs, hv));
    setHexInput(hex);
    onChange(hex);
  }, [hs, hv, onChange]);

  const applyHex = (raw: string) => {
    const clean = raw.trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{6}$/.test(clean)) {
      const hex = `#${clean}`;
      setHsv(rgbToHsv(...hexToRgb(hex)));
      setHexInput(hex);
      onChange(hex);
    } else {
      setHexInput(value);
    }
  };

  // Cursor positions
  const sqCursorX = hs * SQ;
  const sqCursorY = (1 - hv) * SQ;
  const hueCursorY = (hh / 360) * HUE_H;

  return createPortal(
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: 220,
        zIndex: 99999,
        background: "rgba(249,248,246,0.98)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 16,
        boxShadow: "0 8px 40px rgba(26,26,26,0.2), 0 1px 4px rgba(26,26,26,0.08)",
        padding: "14px 14px 12px",
        border: "1px solid rgba(26,26,26,0.08)",
      }}
    >
      {/* Square + hue bar */}
      <div className="flex gap-2">
        {/* SV square */}
        <div className="relative flex-shrink-0" style={{ width: SQ, height: SQ }}>
          <canvas
            ref={sqRef}
            width={SQ}
            height={SQ}
            style={{ display: "block", borderRadius: 6, cursor: "crosshair" }}
            onMouseDown={(e) => {
              e.preventDefault();
              draggingSq.current = true;
              pickSq(e.clientX, e.clientY);
            }}
          />
          {/* Cursor */}
          <div style={{
            position: "absolute",
            width: 12, height: 12,
            borderRadius: "50%",
            border: "2px solid white",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2)",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            left: sqCursorX,
            top: sqCursorY,
          }} />
        </div>

        {/* Hue bar */}
        <div className="relative flex-shrink-0" style={{ width: HUE_W, height: HUE_H }}>
          <canvas
            ref={hueRef}
            width={HUE_W}
            height={HUE_H}
            style={{ display: "block", borderRadius: 6, cursor: "ns-resize" }}
            onMouseDown={(e) => {
              e.preventDefault();
              draggingHue.current = true;
              pickHue(e.clientY);
            }}
          />
          {/* Hue cursor */}
          <div style={{
            position: "absolute",
            left: -2, right: -2,
            height: 3,
            borderRadius: 2,
            background: "white",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.35)",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            top: hueCursorY,
          }} />
        </div>
      </div>

      {/* B&W row */}
      <div className="flex items-center gap-2 mt-3">
        <span style={{ fontFamily: "var(--font-body)", fontSize: 9, color: "#1A1A1A", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.12em" }}>B&W</span>
        {(["#000000", "#ffffff"] as const).map((bw) => (
          <button
            key={bw}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setHsv(rgbToHsv(...hexToRgb(bw))); setHexInput(bw); onChange(bw); }}
            style={{
              width: 22, height: 22, borderRadius: "50%",
              backgroundColor: bw,
              border: "1.5px solid rgba(26,26,26,0.2)",
              outline: value === bw ? "2px solid rgba(26,26,26,0.5)" : "none",
              outlineOffset: 2, flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* Hex input */}
      <div className="flex items-center gap-2 mt-3">
        <div style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: value, border: "1px solid rgba(26,26,26,0.15)", flexShrink: 0 }} />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          onBlur={(e) => applyHex(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          style={{
            fontFamily: "var(--font-body)", fontSize: 12, color: "#1A1A1A",
            background: "transparent", border: "none",
            borderBottom: "1px solid rgba(26,26,26,0.2)",
            outline: "none", width: "100%", paddingBottom: 2,
          }}
          spellCheck={false}
        />
      </div>

      {/* Done */}
      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onClose()}
          style={{
            fontFamily: "var(--font-body)", fontSize: 10,
            textTransform: "uppercase", letterSpacing: "0.14em",
            color: "#1A1A1A", background: "rgba(26,26,26,0.07)",
            border: "1px solid rgba(26,26,26,0.1)", borderRadius: 6,
            padding: "5px 14px", cursor: "pointer", display: "block",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(26,26,26,0.13)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(26,26,26,0.07)")}
        >
          Done
        </button>
      </div>
    </div>,
    document.body
  );
}

// ── Public component ──────────────────────────────────────────────

interface ColorSwatchesProps {
  swatches: string[];
  value: string;
  onChange: (hex: string) => void;
}

export function ColorSwatches({ swatches, value, onChange }: ColorSwatchesProps) {
  const [open, setOpen] = useState(false);
  const dropperRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {swatches.map((c) => (
        <button
          key={c}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange(c)}
          className="w-6 h-6 rounded-full transition-transform hover:scale-110 active:scale-95 flex-shrink-0"
          style={{
            backgroundColor: c,
            outline: c === value ? "2px solid rgba(26,26,26,0.5)" : "none",
            outlineOffset: 2,
          }}
        />
      ))}

      <button
        ref={dropperRef}
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen(true)}
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
        style={{
          background: open ? "rgba(26,26,26,0.12)" : "rgba(26,26,26,0.07)",
          outline: open ? `2px solid ${value}` : "none",
          outlineOffset: 2,
        }}
        title="Custom color"
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M9.5 1.5L12.5 4.5L5.5 11.5L2 12L2.5 8.5L9.5 1.5Z" stroke="#1A1A1A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />
          <circle cx="2.5" cy="12" r="1" fill="#1A1A1A" opacity="0.4" />
        </svg>
      </button>

      {open && (
        <SpectrumPopup
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
          anchorRef={dropperRef}
        />
      )}
    </div>
  );
}
