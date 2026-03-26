import { neon } from "@neondatabase/serverless";
import { waitUntil } from "@vercel/functions";

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

  if (!process.env.naieve_db_POSTGRES_URL_NON_POOLING) {
    return Response.json({ ok: false, error: "Missing database connection string" });
  }

  const sql = neon(process.env.naieve_db_POSTGRES_URL_NON_POOLING);

  if (type === "consent") {
    waitUntil(
      sql`INSERT INTO consent_logs (session_id, consented)
          VALUES (${sessionId}, ${body.consented ?? true})`
        .then(() => console.log("Consent log success"))
        .catch(err => console.error("Consent log error:", err.message))
    );

  } else if (type === "pack_toggle") {
    const { packKey, packLabel, packActive } = body;
    waitUntil(
      sql`INSERT INTO teach_logs (session_id, type, pack_key, pack_label, pack_active)
          VALUES (${sessionId}, 'pack_toggle', ${packKey}, ${packLabel}, ${packActive})`
        .then(() => console.log("Pack toggle log success"))
        .catch(err => console.error("Pack toggle log error:", err.message))
    );

  } else if (type === "custom_entry") {
    const { title, body: entryBody } = body;
    waitUntil(
      sql`INSERT INTO teach_logs (session_id, type, title, body)
          VALUES (${sessionId}, 'custom_entry', ${title}, ${entryBody})`
        .then(() => console.log("Custom entry log success"))
        .catch(err => console.error("Custom entry log error:", err.message))
    );

  } else {
    return Response.json({ ok: false, error: `Unknown log type: ${type}` });
  }

  return Response.json({ ok: true });
}
