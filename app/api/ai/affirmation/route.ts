import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST() {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      system: `You are a source of daily wisdom about the mind. Share one short (1–2 sentence) quote or insight drawn from positive brain science — neuroplasticity, growth mindset, mindfulness, creative cognition, emotional resilience, focus, or cognitive flourishing. Prefer real quotes from real thinkers (Carol Dweck, Rick Hanson, Daniel Siegel, Mihaly Csikszentmihalyi, Oliver Sacks, Barbara Arrowsmith-Young, Norman Doidge, William James, etc.). If it is a real attributed quote, use exact wording. Respond with JSON only in this exact format: {"quote":"the quote text","byline":"— Firstname Lastname"} — or if it is an original insight rather than an attributed quote, use {"quote":"the insight","byline":"— on neuroplasticity"} or similar thematic byline. No emojis. No extra text outside the JSON.`,
      messages: [{ role: "user", content: "Today's brain wisdom, please." }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const parsed = JSON.parse(raw);
    return Response.json({ quote: parsed.quote ?? raw, byline: parsed.byline ?? "" });
  } catch {
    return Response.json({
      quote: "Every experience you have is literally changing your brain.",
      byline: "— Norman Doidge",
    });
  }
}
