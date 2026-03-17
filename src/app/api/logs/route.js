import { sql } from "@vercel/postgres";

// GET /api/logs?view=chat|teach|consent|sessions&sessionId=xxx
// Header: x-admin-token: <ADMIN_TOKEN env var>
export async function GET(req) {
  const token = req.headers.get("x-admin-token");
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const view      = searchParams.get("view") || "sessions";
  const sessionId = searchParams.get("sessionId");
  const limit     = Math.min(parseInt(searchParams.get("limit") || "500"), 2000);

  try {
    if (view === "chat") {
      const { rows } = sessionId
        ? await sql`SELECT * FROM chat_logs WHERE session_id = ${sessionId} ORDER BY created_at ASC LIMIT ${limit}`
        : await sql`SELECT * FROM chat_logs ORDER BY created_at DESC LIMIT ${limit}`;
      return Response.json({ view: "chat", count: rows.length, rows });

    } else if (view === "teach") {
      const { rows } = sessionId
        ? await sql`SELECT * FROM teach_logs WHERE session_id = ${sessionId} ORDER BY created_at ASC LIMIT ${limit}`
        : await sql`SELECT * FROM teach_logs ORDER BY created_at DESC LIMIT ${limit}`;
      return Response.json({ view: "teach", count: rows.length, rows });

    } else if (view === "consent") {
      const { rows } = sessionId
        ? await sql`SELECT * FROM consent_logs WHERE session_id = ${sessionId} ORDER BY created_at DESC LIMIT ${limit}`
        : await sql`SELECT * FROM consent_logs ORDER BY created_at DESC LIMIT ${limit}`;
      return Response.json({ view: "consent", count: rows.length, rows });

    } else if (view === "sessions") {
      // One row per session: consent timestamp, chat turns, teach events, last seen
      const { rows } = await sql`
        SELECT
          COALESCE(c.session_id, t.session_id, co.session_id) AS session_id,
          co.created_at                                        AS consented_at,
          COUNT(DISTINCT c.id)                                 AS chat_turns,
          COUNT(DISTINCT t.id)                                 AS teach_events,
          MIN(LEAST(
            COALESCE(c.created_at,  'infinity'::timestamptz),
            COALESCE(t.created_at,  'infinity'::timestamptz),
            COALESCE(co.created_at, 'infinity'::timestamptz)
          ))                                                   AS first_seen,
          MAX(GREATEST(
            COALESCE(c.created_at,  '-infinity'::timestamptz),
            COALESCE(t.created_at,  '-infinity'::timestamptz),
            COALESCE(co.created_at, '-infinity'::timestamptz)
          ))                                                   AS last_seen,
          STRING_AGG(DISTINCT c.active_packs, ', ')
            FILTER (WHERE c.active_packs != '')               AS packs_used
        FROM consent_logs co
        FULL OUTER JOIN chat_logs  c  ON c.session_id  = co.session_id
        FULL OUTER JOIN teach_logs t  ON t.session_id  = co.session_id
        GROUP BY co.session_id, co.created_at, c.session_id, t.session_id
        ORDER BY last_seen DESC NULLS LAST
        LIMIT ${limit}
      `;
      return Response.json({ view: "sessions", count: rows.length, rows });

    } else {
      return Response.json({ error: "Unknown view. Use: chat, teach, consent, sessions." }, { status: 400 });
    }
  } catch (err) {
    console.error("Log read error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
