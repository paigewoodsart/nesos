import { openDB, DBSchema, IDBPDatabase } from "idb";
import type { Task, Note, Photo, Goal, BrainDump, Client, ClientTask, ClientSession } from "@/types";

interface PlannerDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: { "by-week": string; "by-week-day": [string, number] };
  };
  notes: {
    key: string;
    value: Note;
    indexes: { "by-week": string; "by-week-day": [string, number] };
  };
  photos: {
    key: string;
    value: Photo;
    indexes: { "by-note": string };
  };
  goals: {
    key: string;
    value: Goal;
    indexes: { "by-week": string; "by-type": string };
  };
  braindumps: {
    key: string;
    value: BrainDump;
  };
  clients: {
    key: string;
    value: Client;
  };
  "client-tasks": {
    key: string;
    value: ClientTask;
    indexes: { "by-client": string };
  };
  "client-sessions": {
    key: string;
    value: ClientSession;
    indexes: { "by-client": string; "by-week": string };
  };
}

let dbPromise: Promise<IDBPDatabase<PlannerDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<PlannerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PlannerDB>("chaos-in-bloom", 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const tasks = db.createObjectStore("tasks", { keyPath: "id" });
          tasks.createIndex("by-week", "weekId");
          tasks.createIndex("by-week-day", ["weekId", "dayIndex"]);

          const notes = db.createObjectStore("notes", { keyPath: "id" });
          notes.createIndex("by-week", "weekId");
          notes.createIndex("by-week-day", ["weekId", "dayIndex"]);

          const photos = db.createObjectStore("photos", { keyPath: "id" });
          photos.createIndex("by-note", "noteId");

          const goals = db.createObjectStore("goals", { keyPath: "id" });
          goals.createIndex("by-week", "weekId");
          goals.createIndex("by-type", "type");

          db.createObjectStore("braindumps", { keyPath: "weekId" });
        }
        if (oldVersion < 2) {
          db.createObjectStore("clients", { keyPath: "id" });

          const ct = db.createObjectStore("client-tasks", { keyPath: "id" });
          ct.createIndex("by-client", "clientId");

          const cs = db.createObjectStore("client-sessions", { keyPath: "id" });
          cs.createIndex("by-client", "clientId");
          cs.createIndex("by-week", "weekId");
        }
      },
    });
  }
  return dbPromise;
}
