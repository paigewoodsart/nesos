export interface Task {
  id: string;
  weekId: string;
  dayIndex: number; // 0=Mon ... 6=Sun, -1=week-level
  text: string;
  completed: boolean;
  sortOrder: number;
  startMinute: number | null;
  endMinute: number | null;
  recurring: boolean;
  recurringPattern: "weekly" | "daily" | null;
  createdAt: number;
}

export interface Note {
  id: string;
  weekId: string;
  dayIndex: number;
  text: string;
  photoIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Photo {
  id: string;
  noteId: string;
  blob: Blob;
  mimeType: string;
  filename: string;
  createdAt: number;
}

export interface Goal {
  id: string;
  weekId: string | null;
  text: string;
  completed: boolean;
  type: "weekly" | "longterm";
  createdAt: number;
}

export interface BrainDump {
  weekId: string;
  text: string;
  updatedAt: number;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  colorId?: string;
  isAllDay: boolean;
}

export type BloomState = "bud" | "blooming" | "overgrown";

export interface ParsedTaskAction {
  action: "create_task" | "create_event" | "create_goal" | "complete_task" | "delete_task" | "move_task";
  dayIndex: number | null;
  startMinute: number | null;
  endMinute: number | null;
  text: string;
  recurring: boolean;
  recurringPattern: "weekly" | "daily" | null;
  goalType: "weekly" | "longterm" | null;
  confidence: number;
}

// ── Client system ──────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  color: string; // hex
  notes?: string;
  createdAt: number;
}

export interface ClientTask {
  id: string;
  clientId: string;
  text: string;
  done: boolean;
  doneAt: number | null;
  dueDate: string | null; // "YYYY-MM-DD" or "M/D" shorthand
  archived: boolean;
  archivedAt: number | null;
  createdAt: number;
}

export interface ClientSession {
  id: string;
  clientId: string;
  weekId: string;
  dayIndex: number;
  startMinute: number;
  endMinute: number;
  actualMinutes: number | null; // what they actually spent
  notes: string;                // running log entry for this session
  date: string;                 // YYYY-MM-DD in ICT
  createdAt: number;
}
