"use client";

import { useRef, useState, useEffect } from "react";
import { noteTextColor } from "@/lib/colors";

function noteRotation(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  }
  return ((Math.abs(hash) % 120) / 20) - 3;
}

function loadCollapsedMap(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem("sticky-collapsed") ?? "{}"); } catch { return {}; }
}
function saveCollapsedMap(map: Record<string, boolean>) {
  try { localStorage.setItem("sticky-collapsed", JSON.stringify(map)); } catch { /* noop */ }
}

interface StickyNoteProps {
  id: string;
  title: string;
  color: string;
  initialPos: { x: number; y: number };
  onPositionChange: (id: string, pos: { x: number; y: number }) => void;
  onBringToFront: (id: string) => void;
  zIndex: number;
  footer?: React.ReactNode;
  children: React.ReactNode;
  width?: number;
  onWidthChange?: (id: string, width: number) => void;
  // Edit callbacks — if omitted, note is not editable
  onTitleChange?: (title: string) => void;
  onColorChange?: (color: string) => void;
  onDelete?: () => void;
  colorOptions?: string[];
  onExpand?: (id: string) => void;
}

export function StickyNote({
  id, title, color, initialPos, onPositionChange, onBringToFront, zIndex,
  footer, children,
  width: widthProp = 360,
  onWidthChange,
  onTitleChange, onColorChange, onDelete, colorOptions, onExpand,
}: StickyNoteProps) {
  const [pos, setPos] = useState(initialPos);
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const [collapsed, setCollapsed] = useState<boolean>(() => loadCollapsedMap()[id] ?? false);
  const drag = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resize = useRef<{ startX: number; origW: number } | null>(null);
  const [localWidth, setLocalWidth] = useState(widthProp);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const tilt = noteRotation(id);
  const textColor = noteTextColor(color);
  const lightText = textColor === "#FFFFFF";
  const isEditable = !!(onTitleChange || onColorChange || onDelete);

  useEffect(() => { setPos(initialPos); }, [initialPos.x, initialPos.y]); // eslint-disable-line
  useEffect(() => { setTitleDraft(title); }, [title]);
  useEffect(() => { if (editing) titleInputRef.current?.focus(); }, [editing]);
  useEffect(() => { setLocalWidth(widthProp); }, [widthProp]);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      const map = loadCollapsedMap();
      map[id] = next;
      saveCollapsedMap(map);
      if (!next) onExpand?.(id);
      return next;
    });
  };

  // Drag handlers
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (collapsed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    setIsDragging(true);
    onBringToFront(id);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const x = Math.max(0, drag.current.origX + (e.clientX - drag.current.startX));
    const y = Math.max(0, drag.current.origY + (e.clientY - drag.current.startY));
    setPos({ x, y });
  };

  const onPointerUp = () => {
    if (drag.current) { onPositionChange(id, pos); drag.current = null; setIsDragging(false); }
  };

  // Resize handlers
  const onResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    resize.current = { startX: e.clientX, origW: localWidth };
    onBringToFront(id);
  };

  const onResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resize.current) return;
    const w = Math.min(640, Math.max(340, resize.current.origW + (e.clientX - resize.current.startX)));
    setLocalWidth(w);
  };

  const onResizePointerUp = () => {
    if (resize.current) {
      onWidthChange?.(id, localWidth);
      resize.current = null;
    }
  };

  const commitTitle = () => {
    const t = titleDraft.trim();
    if (t && t !== title) onTitleChange?.(t);
    else setTitleDraft(title);
  };

  const closeEditor = () => {
    commitTitle();
    setEditing(false);
  };

  const rotation = isDragging ? tilt * 0.5 : hovered ? tilt : 0;
  const scale = isDragging ? 1.04 : hovered ? 1.02 : 1;
  const shadow = isDragging
    ? "8px 14px 40px rgba(26,26,26,0.22), 2px 2px 0 rgba(26,26,26,0.06)"
    : hovered
    ? "6px 10px 32px rgba(26,26,26,0.18), 2px 2px 0 rgba(26,26,26,0.06)"
    : "3px 5px 18px rgba(26,26,26,0.13), 1px 1px 0 rgba(26,26,26,0.05)";

  return (
    <div
      className="absolute flex flex-col"
      style={{
        left: pos.x, top: pos.y, width: localWidth, zIndex,
        transform: `rotate(${rotation}deg) scale(${scale})`,
        transformOrigin: "top center",
        boxShadow: shadow,
        transition: isDragging ? "box-shadow 0.15s ease, transform 0.15s ease" : "box-shadow 0.3s ease, transform 0.3s ease",
        userSelect: drag.current ? "none" : "auto",
        willChange: "transform",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pin */}
      <div className="absolute left-1/2 -top-3 -translate-x-1/2 z-10 pointer-events-none">
        <div className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: color, border: "2px solid rgba(26,26,26,0.25)", boxShadow: "0 2px 6px rgba(26,26,26,0.3)" }}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.5)" }} />
        </div>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-1 bg-black/20 rounded-full" />
      </div>

      {/* Header — drag handle */}
      <div
        className={`flex items-center gap-2 px-4 py-3 select-none ${collapsed ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
        style={{ backgroundColor: color }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <h2 className="flex-1 text-xs font-semibold uppercase truncate"
          style={{ fontFamily: "var(--font-body)", color: textColor, letterSpacing: "0.2em", opacity: lightText ? 0.9 : 0.72 }}>
          {title}
        </h2>

        {/* Edit button */}
        {isEditable && (
          <button
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-sm transition-opacity"
            style={{
              color: textColor,
              opacity: (hovered || editing) ? 0.7 : 0,
              backgroundColor: editing ? "rgba(255,255,255,0.2)" : "transparent",
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (editing) { closeEditor(); } else { setTitleDraft(title); setEditing(true); }
            }}
            title={editing ? "Done" : "Edit note"}
          >
            {editing ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 10L10 2M2 2l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8.5 1.5l2 2-6 6-2.5.5.5-2.5 6-6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        )}

        {/* Collapse toggle */}
        <button
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-sm transition-opacity"
          style={{ color: textColor, opacity: (hovered || collapsed) ? 0.6 : 0 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); toggleCollapse(); }}
          title={collapsed ? "Expand" : "Collapse"}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            {collapsed
              ? <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              : <path d="M2 6.5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            }
          </svg>
        </button>

        {!editing && <span className="text-xs flex-shrink-0" style={{ color: textColor, opacity: 0.3 }}>⠿</span>}
      </div>

      {/* Inline edit panel */}
      {editing && !collapsed && (
        <div
          className="px-4 py-3 space-y-3 animate-fade-up"
          style={{ backgroundColor: color + "18", borderTop: `1px solid ${color}40` }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {onTitleChange && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-paper-ink-light mb-1.5" style={{ fontFamily: "var(--font-body)" }}>Name</p>
              <input
                ref={titleInputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { commitTitle(); }
                  if (e.key === "Escape") { setTitleDraft(title); setEditing(false); }
                }}
                className="w-full text-sm font-semibold bg-white border-0 outline-none px-2 py-1.5 text-paper-ink"
                style={{ fontFamily: "var(--font-serif)", borderBottom: "2px solid rgba(26,26,26,0.25)", color: "#1A1A1A" }}
              />
            </div>
          )}

          {onColorChange && colorOptions && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-paper-ink-light mb-2" style={{ fontFamily: "var(--font-body)" }}>Color</p>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onColorChange(c)}
                    className="w-7 h-7 transition-transform hover:scale-110 active:scale-95"
                    style={{
                      backgroundColor: c,
                      outline: c === color ? "3px solid rgba(26,26,26,0.6)" : "2px solid rgba(26,26,26,0.1)",
                      outlineOffset: c === color ? 3 : 1,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => { if (confirm("Remove this project?")) { onDelete(); setEditing(false); } }}
              className="w-full py-1.5 text-xs uppercase tracking-[0.15em] text-paper-ink-light hover:text-white hover:bg-paper-ink transition-colors border border-paper-line"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Remove project
            </button>
          )}
        </div>
      )}

      {/* Body — hidden when collapsed */}
      {!collapsed && (
        <>
          <div style={{ height: 2, backgroundColor: color, opacity: lightText ? 0.35 : 0.2 }} />

          <div className="flex-1 flex flex-col overflow-hidden"
            style={{
              backgroundColor: `${color}18`,
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              borderLeft: "1px solid rgba(255,255,255,0.45)",
              borderRight: "1px solid rgba(255,255,255,0.45)",
              borderBottom: "1px solid rgba(255,255,255,0.45)",
            }}>
            <div className="flex-1 overflow-y-auto max-h-[480px] px-4 py-3.5"
              style={{
                backgroundImage: "repeating-linear-gradient(transparent, transparent 23px, rgba(26,26,26,0.04) 23px, rgba(26,26,26,0.04) 24px)",
                backgroundSize: "100% 24px",
                backgroundPositionY: "12px",
              }}>
              {children}
            </div>

            {footer && (
              <div className="px-4 py-2.5 border-t"
                style={{ borderColor: "rgba(26,26,26,0.07)", backgroundColor: "rgba(26,26,26,0.015)" }}>
                {footer}
              </div>
            )}
          </div>
        </>
      )}

      {/* Right-edge resize handle */}
      {onWidthChange && (
        <div
          className="absolute top-0 bottom-0"
          style={{ right: -3, width: 6, cursor: "ew-resize", zIndex: 20 }}
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
        />
      )}
    </div>
  );
}
