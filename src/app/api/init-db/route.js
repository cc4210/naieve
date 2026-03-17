import { sql } from "@vercel/postgres";

// GET /api/init-db  — call once after deploying to create tables
// Protected by ADMIN_TOKEN env var
export async function GET(req) {
  const token = req.headers.get("x-admin-token");
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await sql`
    CREATE TABLE IF NOT EXISTS consent_logs (
      id          BIGSERIAL PRIMARY KEY,
      session_id  TEXT        NOT NULL,
      consented   BOOLEAN     NOT NULL DEFAULT TRUE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS chat_logs (
      id          BIGSERIAL PRIMARY KEY,
      session_id  TEXT        NOT NULL,
      role        TEXT        NOT NULL,
      content     TEXT        NOT NULL,
      active_packs TEXT       NOT NULL DEFAULT '',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS teach_logs (
      id          BIGSERIAL PRIMARY KEY,
      session_id  TEXT        NOT NULL,
      type        TEXT        NOT NULL,
      pack_key    TEXT,
      pack_label  TEXT,
      pack_active BOOLEAN,
      title       TEXT,
      body        TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  return Response.json({ ok: true, message: "Tables created (or already exist)." });
}
