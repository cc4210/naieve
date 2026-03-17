import { sql } from "@vercel/postgres";

// POST /api/log
// Body: { type: "consent",      sessionId, consented }
//    or { type: "pack_toggle",  sessionId, packKey, packLabel, packActive }
//    or { type: "custom_entry", sessionId, title, body }
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    // Silently ignore malformed log requests — logging must never break the UX
    return Response.json({ ok: false, error: "Invalid JSON" });
  }

  const { type, sessionId } = body;
  if (!type || !sessionId) {
    return Response.json({ ok: false, error: "Missing type or sessionId" });
  }

  try {
    if (type === "consent") {
      await sql`
        INSERT INTO consent_logs (session_id, consented)
        VALUES (${sessionId}, ${body.consented ?? true})
      `;

    } else if (type === "pack_toggle") {
      const { packKey, packLabel, packActive } = body;
      await sql`
        INSERT INTO teach_logs (session_id, type, pack_key, pack_label, pack_active)
        VALUES (${sessionId}, 'pack_toggle', ${packKey}, ${packLabel}, ${packActive})
      `;

    } else if (type === "custom_entry") {
      const { title, body: entryBody } = body;
      await sql`
        INSERT INTO teach_logs (session_id, type, title, body)
        VALUES (${sessionId}, 'custom_entry', ${title}, ${entryBody})
      `;

    } else {
      return Response.json({ ok: false, error: `Unknown log type: ${type}` });
    }

    return Response.json({ ok: true });
  } catch (err) {
    // Log to server console but always return 200 — logging must never break the UX
    console.error("Log write error:", err.message);
    return Response.json({ ok: false, error: err.message });
  }
}
