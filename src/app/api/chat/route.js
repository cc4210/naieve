// POST /api/reflect
// After each chat turn, call this to see if Eve learned something worth noting.
// Returns { entry: string | null } — null means nothing new was taught.

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ entry: null });
  }

  const { userMessage, assistantReply } = body;

  if (!userMessage || !assistantReply) {
    return Response.json({ entry: null });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ entry: null });
  }

  const system = `You are a note-taking assistant for Eve, an 18-year-old first-year engineering student.
Your job is to decide whether a chat exchange taught Eve a new concept, fact, formula, or definition that belongs in her notebook.

Rules:
- If the user taught Eve something genuinely new (a concept, formula, definition, fact, procedure), write a concise notebook entry from Eve's perspective, in first person, as if Eve is jotting it down herself. Keep it under 80 words. Use plain prose — no markdown headers, no bullet points.
- If the conversation was just casual chat, a question Eve already knew, a greeting, or vague/off-topic, respond with exactly: NULL
- Do not invent information. Only note what was explicitly stated in the exchange.
- Start the entry with a bracketed topic label, e.g.: [Reynolds Number] A Reynolds number is...
- Respond with ONLY the entry text or the word NULL. Nothing else.`;

  const prompt = `User said: "${userMessage}"
Eve replied: "${assistantReply}"

Did the user teach Eve something new? If yes, write the notebook entry. If no, respond NULL.`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // fast + cheap for background reflection
        max_tokens: 200,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await resp.json();
    const text = (data.content || []).map(c => c.text || "").join("").trim();

    if (!text || text === "NULL" || text.toUpperCase().startsWith("NULL")) {
      return Response.json({ entry: null });
    }

    return Response.json({ entry: text });
  } catch {
    return Response.json({ entry: null });
  }
}
