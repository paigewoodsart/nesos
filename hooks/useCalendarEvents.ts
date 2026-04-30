"use client";

import useSWR from "swr";
import type { CalendarEvent } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useCalendarEvents(weekId: string) {
  const { data, isLoading, error } = useSWR<CalendarEvent[]>(
    `/api/calendar/events?weekId=${weekId}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    events: data ?? [],
    isLoading,
    error,
  };
}
