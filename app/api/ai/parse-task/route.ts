import Anthropic from "@anthropic-ai/sdk";
import type { ParsedTaskAction } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { message, weekId } = await request.json();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: `You are Bloom Bot, a planner assistant for "Chaos in Bloom", a weekly paper-style planner.
Current week: ${weekId}. Days indexed Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6.
Time stored as minutes since midnight (8am=480, 9am=540, 12pm=720, 5pm=1020).
Respond ONLY with valid JSON matching this exact schema, no prose:
{
  "action": "create_task" | "create_event" | "create_goal" | "complete_task" | "delete_task" | "move_task",
  "dayIndex": number | null,
  "startMinute": number | null,
  "endMinute": number | null,
  "text": string,
  "recurring": boolean,
  "recurringPattern": "weekly" | "daily" | null,
  "goalType": "weekly" | "longterm" | null,
  "confidence": number
}
"recurring" is true when user says "every", "always", "persisting", "repeat", or similar.`,
    messages: [{ role: "user", content: message }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
  let parsed: ParsedTaskAction;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Could not parse response" }, { status: 500 });
  }

  return Response.json(parsed);
}
