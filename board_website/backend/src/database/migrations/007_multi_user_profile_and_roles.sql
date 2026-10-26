-- ==========================================================
-- Migration 007: Multi-User Profile & Roles Composite Isolation
-- Removes single-row CHECK(id=1) from resume_profile and adds composite PK to roles
-- ==========================================================

-- 1. Upgrade resume_profile to support multi-user profiles cleanly
CREATE TABLE IF NOT EXISTS resume_profile_v2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  linkedin TEXT DEFAULT '',
  github TEXT DEFAULT '',
  school TEXT DEFAULT '',
  degree TEXT DEFAULT '',
  grad_date TEXT DEFAULT '',
  gpa TEXT DEFAULT '',
  skills TEXT DEFAULT '',
  projects TEXT DEFAULT '',
  experience TEXT DEFAULT '',
  user_id TEXT UNIQUE DEFAULT 'default_user'
);

INSERT OR IGNORE INTO resume_profile_v2 (id, full_name, email, phone, linkedin, github, school, degree, grad_date, gpa, skills, projects, experience, user_id)
SELECT id, full_name, email, phone, linkedin, github, school, degree, grad_date, gpa, skills, projects, experience, COALESCE(user_id, 'default_user')
FROM resume_profile;

DROP TABLE resume_profile;
ALTER TABLE resume_profile_v2 RENAME TO resume_profile;

CREATE INDEX IF NOT EXISTS idx_resume_profile_user ON resume_profile(user_id);

-- 2. Upgrade roles to support composite PK (name, user_id)
CREATE TABLE IF NOT EXISTS roles_v2 (
  name TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  PRIMARY KEY (name, user_id)
);

INSERT OR IGNORE INTO roles_v2 (name, user_id)
SELECT name, COALESCE(user_id, 'default_user')
FROM roles;

DROP TABLE roles;
ALTER TABLE roles_v2 RENAME TO roles;

CREATE INDEX IF NOT EXISTS idx_roles_user ON roles(user_id);
