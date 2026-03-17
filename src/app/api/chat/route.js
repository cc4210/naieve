import { sql } from "@vercel/postgres";

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
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system,
        messages,
      }),
    });
    data = await resp.json();
  } catch (err) {
    return Response.json({ error: { message: `Anthropic fetch failed: ${err.message}` } }, { status: 502 });
  }

  if (!resp.ok) {
    return Response.json(data, { status: resp.status });
  }

  const replyText = (data.content || []).map(c => c.text || "").join("");

  // ── Log to Postgres (fire-and-forget; never blocks or breaks the response) ─
  if (sessionId) {
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    Promise.all([
      lastUserMsg
        ? sql`INSERT INTO chat_logs (session_id, role, content, active_packs)
               VALUES (${sessionId}, 'user', ${lastUserMsg.content}, ${activePacks})`
        : Promise.resolve(),
      replyText
        ? sql`INSERT INTO chat_logs (session_id, role, content, active_packs)
               VALUES (${sessionId}, 'assistant', ${replyText}, ${activePacks})`
        : Promise.resolve(),
    ]).catch(err => console.error("Chat log error:", err));
  }

  return Response.json(data);
}
