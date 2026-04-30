import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek, addWeeks, format } from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";

export const TZ = "Asia/Bangkok"; // Indochina Time — UTC+7, covers Thailand, Vietnam, Cambodia, Laos

/** Current local date in ICT */
function nowInTZ(): Date {
  return toZonedTime(new Date(), TZ);
}

export function getWeekId(date: Date = new Date()): string {
  const zoned = toZonedTime(date, TZ);
  const year = getISOWeekYear(zoned);
  const week = getISOWeek(zoned).toString().padStart(2, "0");
  return `${year}-W${week}`;
}

export function weekIdToDate(weekId: string): Date {
  const [yearStr, weekStr] = weekId.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  const jan4 = new Date(year, 0, 4);
  const startOfYear = startOfISOWeek(jan4);
  return addWeeks(startOfYear, week - 1);
}

export function getWeekBounds(weekId: string): { start: string; end: string } {
  const monday = weekIdToDate(weekId);
  const startLocal = startOfISOWeek(monday);
  const endLocal = endOfISOWeek(monday);
  // Express bounds as midnight ICT so Google Calendar returns the right day's events
  const start = fromZonedTime(new Date(startLocal.getFullYear(), startLocal.getMonth(), startLocal.getDate(), 0, 0, 0), TZ).toISOString();
  const end = fromZonedTime(new Date(endLocal.getFullYear(), endLocal.getMonth(), endLocal.getDate(), 23, 59, 59), TZ).toISOString();
  return { start, end };
}

export function getWeekDays(weekId: string): Date[] {
  const monday = weekIdToDate(weekId);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function prevWeekId(weekId: string): string {
  const monday = weekIdToDate(weekId);
  return getWeekId(addWeeks(monday, -1));
}

export function nextWeekId(weekId: string): string {
  const monday = weekIdToDate(weekId);
  return getWeekId(addWeeks(monday, 1));
}

export function formatWeekRange(weekId: string): string {
  const days = getWeekDays(weekId);
  const start = format(days[0], "MMM d");
  const end = format(days[6], "MMM d, yyyy");
  return `${start} – ${end}`;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "pm" : "am";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${displayH}${period}` : `${displayH}:${m.toString().padStart(2, "0")}${period}`;
}

/** Convert an ISO datetime string to minutes since midnight in ICT */
export function isoToMinutes(isoString: string): number {
  const zoned = toZonedTime(new Date(isoString), TZ);
  return zoned.getHours() * 60 + zoned.getMinutes();
}

/** Parse a due date string into a Date. Handles "YYYY-MM-DD", "M/D", "MM/DD". Returns null if unparseable. */
export function parseDueDate(str: string | null | undefined): Date | null {
  if (!str) return null;
  const trimmed = str.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }
  // M/D or MM/DD
  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (slash) {
    const year = new Date().getFullYear();
    const d = new Date(year, parseInt(slash[1]) - 1, parseInt(slash[2]));
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Returns "overdue" | "today" | "soon" (within 2 days) | "upcoming" | null */
export function dueDateUrgency(str: string | null | undefined): "overdue" | "today" | "soon" | "upcoming" | null {
  const due = parseDueDate(str);
  if (!due) return null;
  const now = nowInTZ();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diff = Math.floor((dueDay.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 2) return "soon";
  return "upcoming";
}

/** Format a due date string for display: "Apr 24" */
export function formatDueDate(str: string | null | undefined): string | null {
  const d = parseDueDate(str);
  if (!d) return null;
  return format(d, "MMM d");
}

export function isToday(date: Date): boolean {
  const today = nowInTZ();
  const check = toZonedTime(date, TZ);
  return (
    check.getFullYear() === today.getFullYear() &&
    check.getMonth() === today.getMonth() &&
    check.getDate() === today.getDate()
  );
}

/** True if `date` falls on today or within the next `days` calendar days in ICT */
export function isWithinNextDays(date: Date, days: number): boolean {
  const now = nowInTZ();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const futureEnd = new Date(todayStart);
  futureEnd.setDate(todayStart.getDate() + days);
  const check = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return check >= todayStart && check < futureEnd;
}

/** True if an ISO datetime string falls on today's date in ICT */
export function isEventToday(isoString: string): boolean {
  return isToday(new Date(isoString));
}

/** True if an ISO datetime string is in the future and within the next 24 hours (wall clock) */
export function isWithinNext24Hours(isoString: string): boolean {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  return then >= now && then <= now + 24 * 60 * 60 * 1000;
}

/** Format an ISO datetime string as a time label in ICT, e.g. "9am", "2:30pm" */
export function formatEventTime(isoString: string): string {
  return minutesToTime(isoToMinutes(isoString));
}
