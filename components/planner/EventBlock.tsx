import { minutesToTime, isoToMinutes } from "@/lib/dates";
import type { CalendarEvent } from "@/types";

const GCAL_COLORS: Record<string, string> = {
  "1": "#8A9BB0", // lavender → dustBlue
  "2": "#6B7B5E", // sage
  "3": "#B85C38", // grape → rust
  "4": "#C9897A", // flamingo → blush
  "5": "#B85C38", // banana → rust
  "6": "#6B7B5E", // tangerine → sage
  "7": "#8A9BB0", // peacock
  "8": "#7A6E5F", // graphite → inkLight
  "9": "#B85C38", // blueberry
  "10": "#6B7B5E", // basil
  "11": "#C9897A", // tomato
};

interface EventBlockProps {
  event: CalendarEvent;
  pxPerHour?: number;
  startHour?: number;
}

export function EventBlock({ event, pxPerHour = 60, startHour = 6 }: EventBlockProps) {
  if (event.isAllDay) return null;

  const pxPerMin = pxPerHour / 60;
  const startMin = isoToMinutes(event.start);
  const endMin = isoToMinutes(event.end);
  const top = Math.max(0, (startMin - startHour * 60) * pxPerMin);
  const height = Math.max(24, (endMin - startMin) * pxPerMin);
  const color = GCAL_COLORS[event.colorId ?? "1"] ?? "#8A9BB0";

  return (
    <div
      className="absolute left-1 right-1 rounded-sm px-1.5 py-0.5 overflow-hidden cursor-default group"
      style={{
        top,
        height,
        backgroundColor: `${color}22`,
        borderLeft: `3px solid ${color}`,
        boxShadow: "1px 1px 4px rgba(44, 36, 22, 0.06)",
      }}
      title={`${event.summary}\n${minutesToTime(startMin)} – ${minutesToTime(endMin)}`}
    >
      <p
        className="text-xs font-medium leading-tight truncate"
        style={{ color, fontFamily: "var(--font-serif)" }}
      >
        {event.summary}
      </p>
      {height >= 36 && (
        <p className="text-[10px] leading-none" style={{ color, opacity: 0.75 }}>
          {minutesToTime(startMin)}
        </p>
      )}
      <span
        className="absolute top-0.5 right-1 text-[8px] opacity-0 group-hover:opacity-60 transition-opacity"
        style={{ color }}
      >
        G
      </span>
    </div>
  );
}
