-- ==========================================================
-- Migration 005: Multi-User Schema & User Isolation
-- Adds users table, default user, and user_id relations
-- ==========================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  google_refresh_token TEXT DEFAULT '',
  gdrive_folder_id TEXT DEFAULT '',
  created_at DATETIME DEFAULT (datetime('now'))
);

-- 2. Seed Default User (preserves existing data and local access)
INSERT OR IGNORE INTO users (id, email, name)
VALUES ('default_user', 'local@jobtracker.app', 'Default User');
