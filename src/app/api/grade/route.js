// POST /api/grade
// Admin-only Anthropic proxy for the batch notebook grader (/notebook-grader).
// Header: x-admin-token: <ADMIN_TOKEN>
// Body:   { system, messages, model, max_tokens, temperature }
// Returns { text, usage } or { error }.
//
// Separate from /api/chat on purpose: no student logging, longer outputs,
// selectable model, and it is gated because a batch spends real API money.

export const maxDuration = 300;

const ALLOWED_MODELS = new Set([
  "claude-haiku-4-5-20251001", // production Eve
  "claude-haiku-5-5",
  "claude-sonnet-5-5",
  "claude-opus-5-5",
]);
const MAX_TOKENS_CAP = 8000;

async function fetchWithRetry(url, options, maxRetries = 4) {
  let delay = 1500;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let resp;
    try {
      resp = await fetch(url, options);
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    const retry = resp.status === 429 || resp.status === 529 || (resp.status >= 500 && resp.status !== 501);
    if (!retry || attempt === maxRetries) return resp;
    const ra = Number(resp.headers.get("retry-after"));
    await new Promise(r => setTimeout(r, ra > 0 ? ra * 1000 : delay));
    delay *= 2;
  }
}

export async function POST(req) {
  const token = req.headers.get("x-admin-token");
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 500 });
  }

  let body;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { system, messages, model, max_tokens = 3000, temperature = 1 } = body || {};
  if (!ALLOWED_MODELS.has(model)) {
    return Response.json({ error: `Model not allowed: ${model}` }, { status: 400 });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages is required" }, { status: 400 });
  }

  const payload = {
    model,
    max_tokens: Math.min(Math.max(1, Number(max_tokens) || 3000), MAX_TOKENS_CAP),
    temperature: Math.min(Math.max(0, Number(temperature)), 1),
    messages,
  };
  if (system) payload.system = system;

  let resp, data;
  try {
    resp = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });
    const raw = await resp.text();
    data = raw ? JSON.parse(raw) : null;
  } catch (err) {
    return Response.json({ error: `Anthropic request failed: ${err.message}` }, { status: 502 });
  }

  if (!resp.ok || !data) {
    const msg = data?.error?.message || `Anthropic error ${resp.status}`;
    return Response.json({ error: msg }, { status: resp.status || 502 });
  }

  const text = (data.content || []).map(c => c.text || "").join("");
  return Response.json({ text, usage: data.usage, stop_reason: data.stop_reason });
}
