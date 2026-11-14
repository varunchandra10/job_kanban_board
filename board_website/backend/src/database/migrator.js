const fs = require('fs');
const path = require('path');

function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_resets_email ON password_resets(email);
    CREATE TABLE IF NOT EXISTS pending_desktop_auth (
      session_id TEXT PRIMARY KEY,
      token TEXT NOT NULL,
      user_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pending_auth_sess ON pending_desktop_auth(session_id);
    CREATE TABLE IF NOT EXISTS dsa_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      problem_id TEXT NOT NULL,
      status TEXT DEFAULT 'solved',
      notes TEXT DEFAULT '',
      repetition_stage INTEGER DEFAULT 0,
      next_review_date TEXT,
      last_reviewed_at TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, problem_id)
    );
    CREATE INDEX IF NOT EXISTS idx_dsa_user ON dsa_progress(user_id);

    CREATE TABLE IF NOT EXISTS streak_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      slot TEXT DEFAULT 'dinner',
      sent_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, date, type)
    );
    CREATE INDEX IF NOT EXISTS idx_streak_reminders_user ON streak_reminders(user_id, date);

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      user_agent TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, endpoint)
    );
    CREATE INDEX IF NOT EXISTS idx_push_sub_user ON push_subscriptions(user_id);
  `);

  try {
    const reminderCols = db.prepare('pragma table_info(streak_reminders)').all().map(c => c.name);
    if (reminderCols.length && !reminderCols.includes('slot')) {
      db.prepare("alter table streak_reminders add column slot text default 'dinner'").run();
      console.log('[Migrator] Added slot column to streak_reminders');
    }
  } catch (err) {
    console.warn('[Migrator] Note ensuring streak_reminders slot:', err.message);
  }

  try {
    const userCols = db.prepare('pragma table_info(users)').all().map(c => c.name);
    if (userCols.length && !userCols.includes('timezone')) {
      db.prepare("alter table users add column timezone text default 'Asia/Kolkata'").run();
      console.log('[Migrator] Added timezone column to users');
    }
    if (userCols.length && !userCols.includes('streak_reminders_enabled')) {
      db.prepare('alter table users add column streak_reminders_enabled integer default 1').run();
      console.log('[Migrator] Added streak_reminders_enabled column to users');
    }

    const appCols = db.prepare('pragma table_info(applications)').all().map(c => c.name);
    if (appCols.length && !appCols.includes('is_bookmarked')) {
      db.prepare('alter table applications add column is_bookmarked integer default 0').run();
      console.log('[Migrator] Added is_bookmarked column to applications');
    }
  } catch (err) {
    console.warn('[Migrator] Note ensuring users timezone/streak_reminders_enabled:', err.message);
  }

  try {
    const resetCols = db.prepare('pragma table_info(password_resets)').all().map(c => c.name);
    if (resetCols.length && !resetCols.includes('attempts')) {
      db.prepare('alter table password_resets add column attempts integer default 0').run();
      console.log('[Migrator] Added attempts column to password_resets');
    }
  } catch (err) {
    console.warn('[Migrator] Note ensuring password_resets.attempts:', err.message);
  }

  try {
    const dsaCols = db.prepare('pragma table_info(dsa_progress)').all().map(c => c.name);
    if (dsaCols.length) {
      if (!dsaCols.includes('repetition_stage')) {
        db.prepare('alter table dsa_progress add column repetition_stage integer default 0').run();
        console.log('[Migrator] Added repetition_stage column to dsa_progress');
      }
      if (!dsaCols.includes('next_review_date')) {
        db.prepare('alter table dsa_progress add column next_review_date text').run();
        console.log('[Migrator] Added next_review_date column to dsa_progress');
      }
      if (!dsaCols.includes('last_reviewed_at')) {
        db.prepare('alter table dsa_progress add column last_reviewed_at text').run();
        console.log('[Migrator] Added last_reviewed_at column to dsa_progress');
      }
      db.prepare('create index if not exists idx_dsa_review_date on dsa_progress(user_id, next_review_date)').run();
    }
  } catch (err) {
    console.warn('[Migrator] Note ensuring dsa_progress columns:', err.message);
  }

  const appliedRows = db.prepare('SELECT name FROM schema_migrations').all();
  const appliedSet = new Set(appliedRows.map(r => r.name));

  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (!file.endsWith('.sql') && !file.endsWith('.js')) continue;

    if (!appliedSet.has(file)) {
      console.log(`[Migrator] Running migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);

      if (file.endsWith('.sql')) {
        const sql = fs.readFileSync(filePath, 'utf8');
        db.exec('BEGIN TRANSACTION;');
        try {
          if (file.includes('008')) {
            const dsaCols = db.prepare('pragma table_info(dsa_progress)').all().map(c => c.name);
            if (!dsaCols.includes('repetition_stage')) {
              try { db.prepare('alter table dsa_progress add column repetition_stage integer default 0').run(); } catch (_) {}
            }
            if (!dsaCols.includes('next_review_date')) {
              try { db.prepare('alter table dsa_progress add column next_review_date text').run(); } catch (_) {}
            }
            if (!dsaCols.includes('last_reviewed_at')) {
              try { db.prepare('alter table dsa_progress add column last_reviewed_at text').run(); } catch (_) {}
            }
            try { db.prepare('create index if not exists idx_dsa_review_date on dsa_progress(user_id, next_review_date)').run(); } catch (_) {}
          } else {
            db.exec(sql);
          }

          if (file.includes('002')) {
            const appCols = db.prepare('pragma table_info(applications)').all().map(c => c.name);
            const neededCols = ['category', 'portal_url', 'portal_user', 'portal_pass', 'portal_notes', 'custom_tags', 'resume_path', 'cover_letter_path'];
            for (const col of neededCols) {
              if (!appCols.includes(col)) {
                db.prepare(`alter table applications add column ${col} text default ''`).run();
              }
            }
          }

          if (file.includes('005')) {
            const ensureCol = (tbl, col, def) => {
              try {
                const cols = db.prepare(`pragma table_info(${tbl})`).all().map(c => c.name);
                if (!cols.includes(col)) {
                  db.prepare(`alter table ${tbl} add column ${col} ${def}`).run();
                }
              } catch (e) {
                console.warn(`[Migrator] Column note for ${tbl}.${col}:`, e.message);
              }
            };

            const userTables = ['applications', 'learnings', 'roles', 'resume_versions', 'resume_profile', 'settings', 'activity_log'];
            for (const tbl of userTables) {
              ensureCol(tbl, 'user_id', "TEXT DEFAULT 'default_user'");
              try {
                db.prepare(`UPDATE ${tbl} SET user_id = 'default_user' WHERE user_id IS NULL OR user_id = ''`).run();
              } catch (_) {}
            }

            const indices = [
              'CREATE INDEX IF NOT EXISTS idx_apps_user ON applications(user_id);',
              'CREATE INDEX IF NOT EXISTS idx_learn_user ON learnings(user_id);',
              'CREATE INDEX IF NOT EXISTS idx_roles_user ON roles(user_id);',
              'CREATE INDEX IF NOT EXISTS idx_resume_versions_user ON resume_versions(user_id);',
              'CREATE INDEX IF NOT EXISTS idx_settings_user ON settings(user_id);',
              'CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);'
            ];
            for (const idxSql of indices) {
              try { db.exec(idxSql); } catch (_) {}
            }
          }

          if (file.includes('006')) {
            try {
              const uCols = db.prepare('pragma table_info(users)').all().map(c => c.name);
              if (!uCols.includes('password_hash')) {
                db.prepare("alter table users add column password_hash text default ''").run();
              }
            } catch (uErr) {
              console.warn('[Migrator] Note ensuring users.password_hash:', uErr.message);
            }
          }

          db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(file);
          db.exec('COMMIT;');
          console.log(`[Migrator] Successfully applied ${file}`);
        } catch (err) {
          db.exec('ROLLBACK;');
          console.error(`[Migrator] Failed applying ${file}:`, err);
          throw err;
        }
      }
    }
  }
}

module.exports = { runMigrations };
