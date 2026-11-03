-- Secure File Manager - SQLite schema (zero-setup local mode)
-- Roles: user, level1, level2, manager, admin
-- Approval flow: pending_l1 -> pending_l2 -> pending_manager -> approved (or rejected)

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user'
                CHECK (role IN ('user','level1','level2','manager','admin')),
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS files (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  original_name TEXT NOT NULL,
  stored_name   TEXT NOT NULL,
  mime_type     TEXT,
  size          INTEGER NOT NULL,
  uploaded_by   INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending_l1'
                CHECK (status IN ('pending_l1','pending_l2','pending_manager','approved','rejected')),
  current_level INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS approval_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id    INTEGER NOT NULL,
  actor_id   INTEGER NOT NULL,
  action     TEXT NOT NULL CHECK (action IN ('uploaded','approved','rejected')),
  level      INTEGER NOT NULL DEFAULT 0,
  comment    TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_logs_file ON approval_logs(file_id);
