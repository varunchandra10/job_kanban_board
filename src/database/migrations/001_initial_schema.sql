CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company TEXT NOT NULL,
  role TEXT DEFAULT '',
  country TEXT DEFAULT '',
  city TEXT DEFAULT '',
  date_applied TEXT DEFAULT '',
  stage TEXT DEFAULT 'Applied',
  position INTEGER DEFAULT 0,
  jd TEXT DEFAULT '',
  jd_url TEXT DEFAULT '',
  looking_for TEXT DEFAULT '',
  resume_version_id INTEGER,
  recruiter_name TEXT DEFAULT '',
  recruiter_email TEXT DEFAULT '',
  recruiter_notes TEXT DEFAULT '',
  visa TEXT DEFAULT '',
  deadline TEXT DEFAULT '',
  salary TEXT DEFAULT '',
  currency TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS resume_profile (
  id INTEGER PRIMARY KEY CHECK(id=1),
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
  experience TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS resume_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT DEFAULT 'New version',
  region TEXT DEFAULT '',
  text TEXT DEFAULT '',
  pdf_name TEXT DEFAULT '',
  pdf_data TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS companies (
  name TEXT PRIMARY KEY,
  city TEXT,
  country TEXT
);

CREATE TABLE IF NOT EXISTS roles (
  name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
