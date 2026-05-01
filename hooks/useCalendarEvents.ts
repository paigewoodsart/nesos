"use client";

import type { CalendarEvent } from "@/types";

// Calendar integration paused — returning empty until Google Calendar is properly configured
export function useCalendarEvents(_weekId: string) {
  return {
    events: [] as CalendarEvent[],
    isLoading: false,
    error: null,
  };
}
