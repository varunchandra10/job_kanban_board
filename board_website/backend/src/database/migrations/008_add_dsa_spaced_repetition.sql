-- ==========================================================
-- Migration 008: Add DSA Spaced Repetition (The 1-4-7 Rule)
-- Adds repetition_stage, next_review_date, and last_reviewed_at
-- ==========================================================

ALTER TABLE dsa_progress ADD COLUMN repetition_stage INTEGER DEFAULT 0;
ALTER TABLE dsa_progress ADD COLUMN next_review_date TEXT;
ALTER TABLE dsa_progress ADD COLUMN last_reviewed_at TEXT;
CREATE INDEX IF NOT EXISTS idx_dsa_review_date ON dsa_progress(user_id, next_review_date);
