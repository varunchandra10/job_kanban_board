-- ==========================================================
-- Migration 010: Add career profile extended fields
-- Supports dynamic Education, Projects, Skills Matrix,
-- Achievements/Honors, and Portfolio Resume Selection.
-- ==========================================================

ALTER TABLE resume_profile ADD COLUMN age TEXT DEFAULT '';
ALTER TABLE resume_profile ADD COLUMN location TEXT DEFAULT '';
ALTER TABLE resume_profile ADD COLUMN bio TEXT DEFAULT '';
ALTER TABLE resume_profile ADD COLUMN education_history TEXT DEFAULT '[]';
ALTER TABLE resume_profile ADD COLUMN projects_list TEXT DEFAULT '[]';
ALTER TABLE resume_profile ADD COLUMN skills_matrix TEXT DEFAULT '{}';
ALTER TABLE resume_profile ADD COLUMN achievements TEXT DEFAULT '[]';
ALTER TABLE resume_profile ADD COLUMN portfolio_resume_id INTEGER DEFAULT NULL;

