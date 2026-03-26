import { neon } from "@neondatabase/serverless";
import { waitUntil } from "@vercel/functions";

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
    return Response.json({ error: { message: "Invalid request body" } }, { status: 400 });
  }

  const { system, messages, sessionId, activePacks = "" } = body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: { message: "ANTHROPIC_API_KEY is not set in environment variables." } },
      { status: 500 }
    );
  }

  // ── Call Anthropic ─────────────────────────────────────────────────────────
  let resp, data;
  try {
    resp = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system,
        messages,
      }),
    });
    data = await safeJson(resp);
    if (!data) throw new Error(`Empty response from Anthropic (status ${resp.status})`);
  } catch (err) {
    return Response.json({ error: { message: `Anthropic fetch failed: ${err.message}` } }, { status: 502 });
  }

  if (!resp.ok) {
    return Response.json(data, { status: resp.status });
  }

  const replyText = (data.content || []).map(c => c.text || "").join("");

  // ── Log to Postgres (waitUntil keeps function alive until logging completes) ─
  if (sessionId && process.env.naieve_db_POSTGRES_URL_NON_POOLING) {
    const sql = neon(process.env.naieve_db_POSTGRES_URL_NON_POOLING);
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    waitUntil(
      Promise.all([
        lastUserMsg
          ? sql`INSERT INTO chat_logs (session_id, role, content, active_packs)
                 VALUES (${sessionId}, 'user', ${lastUserMsg.content}, ${activePacks})`
          : Promise.resolve(),
        replyText
          ? sql`INSERT INTO chat_logs (session_id, role, content, active_packs)
                 VALUES (${sessionId}, 'assistant', ${replyText}, ${activePacks})`
          : Promise.resolve(),
      ]).then(() => console.log("Chat log success"))
        .catch(err => console.error("Chat log error:", err.message))
    );
  }

  return Response.json(data);
}
