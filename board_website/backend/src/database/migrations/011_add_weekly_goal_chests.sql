-- ==========================================================
-- Migration 011: Add Weekly Goal Chests & Historical Vault
-- Tracks weekly quest targets, live progress, completion,
-- and bonus XP awards for weekly milestone reward chests.
-- ==========================================================

CREATE TABLE IF NOT EXISTS weekly_chests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  week_id TEXT NOT NULL,
  target_apps INTEGER DEFAULT 10,
  target_dsa INTEGER DEFAULT 5,
  target_study_minutes INTEGER DEFAULT 180,
  current_apps INTEGER DEFAULT 0,
  current_dsa INTEGER DEFAULT 0,
  current_study_minutes INTEGER DEFAULT 0,
  is_claimed INTEGER DEFAULT 0,
  claimed_at TEXT DEFAULT NULL,
  bonus_xp_awarded INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, week_id)
);

CREATE INDEX IF NOT EXISTS idx_weekly_chests_user_week ON weekly_chests(user_id, week_id);
CREATE INDEX IF NOT EXISTS idx_weekly_chests_user ON weekly_chests(user_id);
