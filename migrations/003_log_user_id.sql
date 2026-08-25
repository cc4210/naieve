-- Key every log row to the masked user id.
--
-- Nullable on purpose: rows carried over from the Vercel/Neon database predate
-- authentication and have no user to attribute them to. Making this NOT NULL
-- would require inventing an owner for them.
--
-- `session_id` stays. It already identifies a conversation (one per browser tab),
-- so (user_id, session_id) is the grouping key — no separate conversation table —
-- and existing `?sessionId=` queries against /api/logs keep working.

ALTER TABLE consent_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES app_user(id);
ALTER TABLE chat_logs    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES app_user(id);
ALTER TABLE teach_logs   ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES app_user(id);

CREATE INDEX IF NOT EXISTS consent_logs_user_idx ON consent_logs (user_id);
CREATE INDEX IF NOT EXISTS chat_logs_user_idx    ON chat_logs    (user_id);
CREATE INDEX IF NOT EXISTS teach_logs_user_idx   ON teach_logs   (user_id);
