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

// ── Canvas wheel ──────────────────────────────────────────────────

const WHEEL_SIZE = 180;

function drawWheel(canvas: HTMLCanvasElement, brightness: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = WHEEL_SIZE;
  const cx = size / 2, cy = size / 2, r = size / 2 - 1;
  const img = ctx.createImageData(size, size);
  const { data } = img;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const dx = px - cx, dy = py - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const i = (py * size + px) * 4;
      if (dist <= r) {
        const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
        const sat = dist / r;
        const [rr, gg, bb] = hsvToRgb(hue, sat, brightness);
        data[i] = rr; data[i + 1] = gg; data[i + 2] = bb; data[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const [h, s, v] = rgbToHsv(...hexToRgb(value));
  const [hsv, setHsv] = useState<[number, number, number]>([h, s, v]);
  const [hexInput, setHexInput] = useState(value);

  const [hh, hs, hv] = hsv;

  // Compute popup rect from anchor — inline, no state delay
  const getRect = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return { top: 100, left: 100 };
    const rect = anchor.getBoundingClientRect();
    const popupH = 350, popupW = 216;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > popupH + 8 ? rect.bottom + 8 : rect.top - popupH - 8;
    const left = Math.min(Math.max(rect.left - 8, 8), window.innerWidth - popupW - 8);
    return { top, left };
  }, [anchorRef]);

  const popupStyle = getRect();

  // Draw wheel whenever brightness changes — also runs on mount since canvas is always present
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawWheel(canvas, hv);
  }, [hv]);

  // Sync when value changes externally
  useEffect(() => {
    const newHsv = rgbToHsv(...hexToRgb(value));
    setHsv(newHsv);
    setHexInput(value);
  }, [value]);

  // Close on outside mousedown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popupRef.current && !popupRef.current.contains(target) &&
        anchorRef.current && !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  // Global mousemove/mouseup for drag
  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) pickFromWheel(e.clientX, e.clientY); };
    const onUp = () => { dragging.current = false; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hh, hs, hv]);

  const pickFromWheel = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    const dx = clientX - rect.left - cx;
    const dy = clientY - rect.top - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = rect.width / 2;
    const newH = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    const newS = Math.min(dist / radius, 1);
    setHsv([newH, newS, hv]);
    const hex = rgbToHex(...hsvToRgb(newH, newS, hv));
    setHexInput(hex);
    onChange(hex);
  }, [hv, onChange]);

  const cursorX = WHEEL_SIZE / 2 + hs * (WHEEL_SIZE / 2 - 1) * Math.cos((hh * Math.PI) / 180);
  const cursorY = WHEEL_SIZE / 2 + hs * (WHEEL_SIZE / 2 - 1) * Math.sin((hh * Math.PI) / 180);
  const brightnessColor = rgbToHex(...hsvToRgb(hh, hs, 1));

  const applyBrightness = (newV: number) => {
    setHsv([hh, hs, newV]);
    const hex = rgbToHex(...hsvToRgb(hh, hs, newV));
    setHexInput(hex);
    onChange(hex);
  };

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

  return createPortal(
    <div
      ref={popupRef}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: popupStyle.top,
        left: popupStyle.left,
        width: 216,
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
      {/* Wheel */}
      <div className="relative mx-auto" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
        <canvas
          ref={canvasRef}
          width={WHEEL_SIZE}
          height={WHEEL_SIZE}
          style={{ borderRadius: "50%", display: "block", cursor: "crosshair" }}
          onMouseDown={(e) => {
            e.preventDefault();
            dragging.current = true;
            pickFromWheel(e.clientX, e.clientY);
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 12, height: 12,
            borderRadius: "50%",
            background: rgbToHex(...hsvToRgb(hh, hs, hv)),
            border: "2px solid white",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.25)",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            left: cursorX,
            top: cursorY,
          }}
        />
      </div>

      {/* Brightness slider */}
      <div className="mt-3">
        <input
          type="range" min={0} max={100}
          value={Math.round(hv * 100)}
          onChange={(e) => applyBrightness(parseInt(e.target.value) / 100)}
          style={{
            width: "100%", appearance: "none", WebkitAppearance: "none",
            height: 10, borderRadius: 5, outline: "none", cursor: "pointer",
            background: `linear-gradient(to right, #000, ${brightnessColor})`,
          }}
        />
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
        onClick={() => setOpen((v) => !v)}
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
