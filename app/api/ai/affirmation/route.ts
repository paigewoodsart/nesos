import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST() {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      system: `You are a curator of stoic and general wisdom. Share one short quote (1–2 sentences) drawn from stoic philosophy or adjacent wisdom traditions - Marcus Aurelius, Seneca, Epictetus, Zeno, as well as Montaigne, Pascal, and other thinkers in the stoic spirit. Prefer real, exact quotes where possible. Respond with JSON only: {"quote":"the quote text","byline":"- Firstname Lastname"}. No emojis. No extra text outside the JSON.`,
      messages: [{ role: "user", content: "Today's wisdom." }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const parsed = JSON.parse(raw);
    return Response.json({ quote: parsed.quote ?? raw, byline: parsed.byline ?? "" });
  } catch {
    // Client will fall back to curated list on failure
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
