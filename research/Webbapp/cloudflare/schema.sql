CREATE TABLE IF NOT EXISTS portal_state (
  device_id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_portal_state_updated_at ON portal_state(updated_at);

CREATE TABLE IF NOT EXISTS answer_keys (
  device_id TEXT NOT NULL,
  test_no INTEGER NOT NULL,
  paper_code TEXT NOT NULL,
  key_payload TEXT NOT NULL,
  source TEXT NOT NULL,
  version INTEGER NOT NULL,
  share_code TEXT NOT NULL UNIQUE,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(device_id, test_no)
);
CREATE INDEX IF NOT EXISTS idx_answer_keys_share_code ON answer_keys(share_code);
