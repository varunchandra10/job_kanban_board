CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER NOT NULL,
  type TEXT DEFAULT 'stage_change',
  detail TEXT DEFAULT '',
  ts TEXT DEFAULT (datetime('now'))
);
