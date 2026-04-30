import { auth } from "@/lib/auth";
import { getWeekBounds } from "@/lib/dates";
import type { CalendarEvent } from "@/types";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json([], { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const weekId = searchParams.get("weekId");
  if (!weekId) return Response.json([], { status: 400 });

  const { start, end } = getWeekBounds(weekId);

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    `timeMin=${encodeURIComponent(start)}&timeMax=${encodeURIComponent(end)}&singleEvents=true&orderBy=startTime`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  if (!res.ok) {
    return Response.json([], { status: 200 });
  }

  const data = await res.json();
  const items = (data.items ?? []) as Record<string, unknown>[];

  const events: CalendarEvent[] = items.map((item) => ({
    id: item.id as string,
    summary: (item.summary as string) ?? "(no title)",
    start: ((item.start as Record<string, string>)?.dateTime ?? (item.start as Record<string, string>)?.date ?? "") as string,
    end: ((item.end as Record<string, string>)?.dateTime ?? (item.end as Record<string, string>)?.date ?? "") as string,
    colorId: item.colorId as string | undefined,
    isAllDay: !(item.start as Record<string, string>)?.dateTime,
  }));

  return Response.json(events);
}
