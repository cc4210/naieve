// POST /api/reflect
// After each chat turn, call this to see if Eve learned something worth noting.
// Returns { entry: string | null } — null means nothing new was taught.


// Retry with exponential backoff — handles 529 Overloaded, 5xx, and empty responses
async function fetchWithRetry(url, options, maxRetries = 3) {
  let delay = 1000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const resp = await fetch(url, options);
    const shouldRetry = resp.status === 529 || (resp.status >= 500 && resp.status !== 501);
    if (!shouldRetry || attempt === maxRetries) return resp;
    await new Promise(res => setTimeout(res, delay));
    delay *= 2;
  }
}

// Safe JSON parse — returns null instead of throwing on empty/invalid body
async function safeJson(resp) {
  const text = await resp.text();
  if (!text || !text.trim()) return null;
  try { return JSON.parse(text); } catch { return null; }
}


export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ entry: null });
  }

  const { userMessage, assistantReply, existingNotebook } = body;

  if (!userMessage || !assistantReply) {
    return Response.json({ entry: null });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ entry: null });
  }

  const notebookSection = existingNotebook
    ? `\n\nEVE'S EXISTING TAUGHT KNOWLEDGE (entries already in her notebook from this semester):\n${existingNotebook}`
    : "\n\nEVE'S EXISTING TAUGHT KNOWLEDGE: (nothing taught yet this semester)";

  const system = `You are a strictly literal transcription assistant for Eve, an 18-year-old first-year engineering student.
Your job is to decide whether the user explicitly taught Eve a new fact, formula, definition, or concept — and if so, transcribe ONLY what was directly stated.

Rules:
- Record ONLY the exact substance of what the user said. Do not infer, expand, explain, complete, or add any context not present in the user's words.
- Do not use Eve's pretrained knowledge or anything outside the user's message to enrich the entry.
- If the new concept shares a topic name with something already in Eve's notebook, you may note "see also: [Topic]" at the end — but add nothing else about that topic.
- If the user did not explicitly teach anything new — question, casual chat, greeting, Eve answering, vague/off-topic — respond with exactly: NULL
- Write the entry in first person, starting with a bracketed topic label. Keep it under 60 words.
- WRONG: user says "Reynolds number relates to flow turbulence" → entry elaborates with "it is a dimensionless ratio of inertial to viscous forces" — fabrication.
- RIGHT: user says "Reynolds number relates to flow turbulence" → "[Reynolds Number] Reynolds number relates to flow turbulence."
- Respond with ONLY the entry text or the word NULL. Nothing else.${notebookSection}`;

  const prompt = `User said: "${userMessage}"
Eve replied: "${assistantReply}"

Did the user explicitly teach Eve something new? If yes, write the notebook entry. If no, respond NULL.`;

  try {
    const resp = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
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

    const data = await safeJson(resp);
    if (!data) throw new Error(`Empty response from Anthropic (status ${resp.status})`);
    const text = (data.content || []).map(c => c.text || "").join("").trim();

    if (!text || text === "NULL" || text.toUpperCase().startsWith("NULL")) {
      return Response.json({ entry: null });
    }

    return Response.json({ entry: text });
  } catch {
    return Response.json({ entry: null });
  }
}
