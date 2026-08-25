import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

// POST /api/log
//
// Event types the client emits (src/components/NAIEve.jsx):
//   consent           { sessionId, consented }
//   pack_toggle       { sessionId, packKey, packLabel, packActive }
//   proc_pack_toggle  { sessionId, packKey, packLabel, packActive }
//   custom_entry      { sessionId, title, body, mode }
//   auto_learn        { sessionId, entry }
//   filter_triggered  { sessionId, original, replacement }
//
// NOTE: in Phase 2 sessionId goes away — identity comes from the server-side
// Keycloak session and client-supplied ids are ignored.

async function insertTeachLog({ userId, sessionId, type, packKey, packLabel, packActive, title, body, metadata }) {
  await sql`
    INSERT INTO teach_logs
      (user_id, session_id, type, pack_key, pack_label, pack_active, title, body, metadata)
    VALUES
      (${userId}, ${sessionId}, ${type}, ${packKey ?? null}, ${packLabel ?? null},
       ${packActive ?? null}, ${title ?? null}, ${body ?? null},
       ${metadata ? JSON.stringify(metadata) : null})
  `;
}

export async function POST(req) {
  const session = await getSession();
  if (!session?.uid) {
    return Response.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  // Identity is the server session's, never the request body's.
  const userId = session.uid;

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
    switch (type) {
      case "consent":
        await sql`
          INSERT INTO consent_logs (user_id, session_id, consented)
          VALUES (${userId}, ${sessionId}, ${body.consented ?? true})
        `;
        break;

      case "pack_toggle":
      case "proc_pack_toggle":
        await insertTeachLog({
          userId,
          sessionId,
          type,
          packKey: body.packKey,
          packLabel: body.packLabel,
          packActive: body.packActive,
        });
        break;

      case "custom_entry":
        await insertTeachLog({
          userId,
          sessionId,
          type,
          title: body.title,
          body: body.body,
          metadata: body.mode ? { mode: body.mode } : null,
        });
        break;

      case "auto_learn":
        // What Eve decided she learned from the turn.
        await insertTeachLog({ userId, sessionId, type, body: body.entry });
        break;

      case "filter_triggered":
        // Both sides matter for research: what Eve said, and what she said instead.
        await insertTeachLog({
          userId,
          sessionId,
          type,
          body: body.replacement,
          metadata: { original: body.original },
        });
        break;

      default:
        // Store rather than drop. An unrecognized type means the client grew an
        // event the server doesn't know about yet — which is exactly how
        // auto_learn, filter_triggered and proc_pack_toggle went unrecorded.
        // Keeping the payload costs a row; losing the signal is unrecoverable.
        console.warn(`Unknown log type stored verbatim: ${type}`);
        await insertTeachLog({ userId, sessionId, type, metadata: body });
        break;
    }

    return Response.json({ ok: true });
  } catch (err) {
    // Log to server console but always return 200 — logging must never break the UX
    console.error("Log write error:", err.message);
    return Response.json({ ok: false, error: err.message });
  }
}
