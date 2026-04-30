import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST() {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 150,
      system: "You are a warm companion for a creative freelance woman. Generate one short (1-2 sentence), sincere, heartfelt affirmation for her day. No emojis, no hashtags. Just honest, grounding words.",
      messages: [{ role: "user", content: "Give me my daily affirmation." }],
    });

    const text = response.content[0].type === "text"
      ? response.content[0].text.trim()
      : "You are exactly where you need to be.";

    return Response.json({ text });
  } catch {
    return Response.json({ text: "You are exactly where you need to be." });
  }
}
