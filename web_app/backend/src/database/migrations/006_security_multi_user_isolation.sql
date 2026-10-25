-- ==========================================================
-- Migration 006: Password Hashing & Settings Multi-User Isolation
-- Adds password_hash column to users and composite PK on settings
-- ==========================================================

-- 1. Ensure password_hash column in users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  password_hash TEXT DEFAULT '',
  google_refresh_token TEXT DEFAULT '',
  gdrive_folder_id TEXT DEFAULT '',
  created_at DATETIME DEFAULT (datetime('now'))
);

-- 2. Migrate settings table to composite primary key (key, user_id)
CREATE TABLE IF NOT EXISTS settings_v2 (
  key TEXT NOT NULL,
  value TEXT DEFAULT '',
  user_id TEXT NOT NULL DEFAULT 'default_user',
  PRIMARY KEY (key, user_id)
);

INSERT OR IGNORE INTO settings_v2 (key, value, user_id)
SELECT key, value, COALESCE(user_id, 'default_user') FROM settings;

DROP TABLE settings;
ALTER TABLE settings_v2 RENAME TO settings;

CREATE INDEX IF NOT EXISTS idx_settings_user ON settings(user_id);
