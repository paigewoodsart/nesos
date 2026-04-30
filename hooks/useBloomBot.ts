"use client";

import { useState, useCallback } from "react";
import type { ParsedTaskAction } from "@/types";

interface BotMessage {
  role: "user" | "bot";
  text: string;
}

export function useBloomBot(
  weekId: string,
  onAction: (action: ParsedTaskAction) => Promise<string>
) {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<ParsedTaskAction | null>(null);

  const send = useCallback(async (text: string) => {
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    const res = await fetch("/api/ai/parse-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, weekId }),
    });
    const action: ParsedTaskAction = await res.json();
    setLoading(false);

    if (action.confidence < 0.7) {
      setPendingAction(action);
      const preview = formatAction(action);
      setMessages((prev) => [...prev, { role: "bot", text: `Did you mean: ${preview}?` }]);
    } else {
      const confirmation = await onAction(action);
      setMessages((prev) => [...prev, { role: "bot", text: confirmation }]);
    }
  }, [weekId, onAction]);

  const confirmPending = useCallback(async () => {
    if (!pendingAction) return;
    const confirmation = await onAction(pendingAction);
    setMessages((prev) => [...prev, { role: "bot", text: confirmation }]);
    setPendingAction(null);
  }, [pendingAction, onAction]);

  const rejectPending = useCallback(() => {
    setMessages((prev) => [...prev, { role: "bot", text: "No worries! Try rephrasing and I'll give it another shot." }]);
    setPendingAction(null);
  }, []);

  return { messages, loading, pendingAction, send, confirmPending, rejectPending };
}

function formatAction(action: ParsedTaskAction): string {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const day = action.dayIndex !== null ? days[action.dayIndex] : "this week";
  const time = action.startMinute !== null ? ` at ${minutesToTime(action.startMinute)}` : "";
  return `"${action.text}" on ${day}${time}`;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "pm" : "am";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${displayH}${period}` : `${displayH}:${m.toString().padStart(2, "0")}${period}`;
}
