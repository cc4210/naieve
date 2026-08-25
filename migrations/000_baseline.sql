-- Baseline: the three tables that /api/init-db used to create.
--
-- Deliberately IF NOT EXISTS and column-for-column identical to the old
-- init-db route, so applying this against the existing Vercel Postgres
-- database is a no-op rather than a conflict.

CREATE TABLE IF NOT EXISTS consent_logs (
  id          BIGSERIAL   PRIMARY KEY,
  session_id  TEXT        NOT NULL,
  consented   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_logs (
  id           BIGSERIAL   PRIMARY KEY,
  session_id   TEXT        NOT NULL,
  role         TEXT        NOT NULL,
  content      TEXT        NOT NULL,
  active_packs TEXT        NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teach_logs (
  id          BIGSERIAL   PRIMARY KEY,
  session_id  TEXT        NOT NULL,
  type        TEXT        NOT NULL,
  pack_key    TEXT,
  pack_label  TEXT,
  pack_active BOOLEAN,
  title       TEXT,
  body        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
