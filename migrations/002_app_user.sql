-- The mask. `id` is the only user identifier that ever leaves this database;
-- `keycloak_sub` is the immutable Keycloak subject it stands in for.
--
-- gen_random_uuid() is built into Postgres 13+, so no pgcrypto extension needed.

CREATE TABLE IF NOT EXISTS app_user (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  keycloak_sub  TEXT        NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE app_user IS
  'Maps a Keycloak sub to an opaque per-user UUID. Deliberately holds no username, email or display name: persisting those would defeat the mask.';

COMMENT ON COLUMN app_user.keycloak_sub IS
  'Keycloak sub claim. MUST NOT appear in any API response, export, log line, or error message. Read only by upsertUser() at login.';
