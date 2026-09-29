CREATE TABLE IF NOT EXISTS portal_state (
  device_id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_portal_state_updated_at ON portal_state(updated_at);
