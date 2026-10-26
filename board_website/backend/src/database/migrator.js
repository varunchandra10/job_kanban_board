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
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_resets_email ON password_resets(email);
  `);

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
          db.exec(sql);

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
