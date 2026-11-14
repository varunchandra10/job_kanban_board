-- ==========================================================
-- Migration 009: Add Public "Proof-of-Work" Portfolio
-- Adds portfolio_slug, is_portfolio_public, portfolio_headline, and portfolio_bio
-- ==========================================================

ALTER TABLE users ADD COLUMN portfolio_slug TEXT;
ALTER TABLE users ADD COLUMN is_portfolio_public INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN portfolio_headline TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN portfolio_bio TEXT DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_portfolio_slug ON users(portfolio_slug);

ALTER TABLE resume_profile ADD COLUMN portfolio_slug TEXT;
ALTER TABLE resume_profile ADD COLUMN is_portfolio_public INTEGER DEFAULT 0;
ALTER TABLE resume_profile ADD COLUMN portfolio_headline TEXT DEFAULT '';
ALTER TABLE resume_profile ADD COLUMN portfolio_bio TEXT DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_resume_profile_portfolio_slug ON resume_profile(portfolio_slug);

