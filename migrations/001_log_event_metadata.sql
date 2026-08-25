-- The client emits several event types whose payloads don't map onto
-- teach_logs' fixed columns (auto_learn carries a notebook entry;
-- filter_triggered carries both the original reply and its replacement;
-- custom_entry carries a fact/proc mode). Those three were being dropped
-- entirely — /api/log had no branch for them and the client swallowed the
-- failure — so this column is what makes them storable.

ALTER TABLE teach_logs ADD COLUMN IF NOT EXISTS metadata JSONB;

-- teach_logs is read by type far more often than by anything else, and the
-- session scan goes away in Phase 2 when rows become user-scoped.
CREATE INDEX IF NOT EXISTS teach_logs_type_idx       ON teach_logs (type);
CREATE INDEX IF NOT EXISTS teach_logs_session_idx    ON teach_logs (session_id);
CREATE INDEX IF NOT EXISTS chat_logs_session_idx     ON chat_logs (session_id);
CREATE INDEX IF NOT EXISTS consent_logs_session_idx  ON consent_logs (session_id);
