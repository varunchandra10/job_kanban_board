const { createClient } = require('@libsql/client');
let LibsqlDatabase = null;
try {
  LibsqlDatabase = require('libsql');
} catch (libsqlErr) {
  console.warn('[Database Engine] Native LibSQL driver note:', libsqlErr.message);
}

let DatabaseSync = null;
try {
  DatabaseSync = require('node:sqlite').DatabaseSync;
} catch (err) {
  console.warn('[Database Engine] node:sqlite not available:', err.message);
}

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { runMigrations } = require('./migrator');

function performDbBackup() {
  if (config.tursoDatabaseUrl || !fs.existsSync(config.dbPath)) return;
  try {
    const backupDir = config.backupDir;
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 10);
    const backupFile = path.join(backupDir, `tracker-${timestamp}.db.bak`);

    if (!fs.existsSync(backupFile)) {
      fs.copyFileSync(config.dbPath, backupFile);
      console.log(`[Database Backup] Daily snapshot saved: ${path.basename(backupFile)}`);
    }

    fs.copyFileSync(config.dbPath, `${config.dbPath}.bak`);

    const files = fs.readdirSync(backupDir).filter(f => f.startsWith('tracker-') && f.endsWith('.bak'));
    if (files.length > 14) {
      files.sort().slice(0, files.length - 14).forEach(f => {
        try { fs.unlinkSync(path.join(backupDir, f)); } catch (_) {}
      });
    }
  } catch (err) {
    console.warn('[Database Backup] Warning during backup:', err.message);
  }
}

if (!process.env.VERCEL && !config.tursoDatabaseUrl) {
  performDbBackup();
  setInterval(performDbBackup, 24 * 60 * 60 * 1000).unref();
}

if (process.env.VERCEL && !config.tursoDatabaseUrl) {
  console.warn('\n' + '='.repeat(70));
  console.warn('⚠️  [CRITICAL ARCHITECTURAL NOTICE: EPHEMERAL VERCEL DEPLOYMENT]');
  console.warn('   Application is running in serverless Vercel environment without TURSO_DATABASE_URL.');
  console.warn('   Data will be stored in /tmp/tracker.db, which is ephemeral and will be wiped');
  console.warn('   when serverless function instances spin down.');
  console.warn('   To guarantee permanent multi-user persistence, configure TURSO_DATABASE_URL');
  console.warn('   and TURSO_AUTH_TOKEN in your Vercel Project Settings.');
  console.warn('='.repeat(70) + '\n');

  const tmpDir = path.dirname(config.dbPath);
  if (!fs.existsSync(tmpDir)) {
    try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (_) {}
  }
  if (!fs.existsSync(config.dbPath)) {
    const templateDb = fs.existsSync(path.join(__dirname, 'tracker.template.db'))
      ? path.join(__dirname, 'tracker.template.db')
      : path.join(config.rootDir, 'tracker.db');
    if (fs.existsSync(templateDb)) {
      try {
        fs.copyFileSync(templateDb, config.dbPath);
        if (fs.existsSync(templateDb + '-wal')) {
          try { fs.copyFileSync(templateDb + '-wal', config.dbPath + '-wal'); } catch (_) {}
        }
        if (fs.existsSync(templateDb + '-shm')) {
          try { fs.copyFileSync(templateDb + '-shm', config.dbPath + '-shm'); } catch (_) {}
        }
        console.log('[Vercel SQLite] Initialized /tmp/tracker.db from bundle template');
      } catch (e) {
        console.warn('[Vercel SQLite] Could not copy template db, will initialize fresh:', e.message);
      }
    }
  }
}

let db;
let tursoClient = null;

if (config.tursoDatabaseUrl) {
  console.log('[Database Engine] TURSO_DATABASE_URL detected. Configuring Turso / LibSQL client for remote edge SQLite...');
  tursoClient = createClient({
    url: config.tursoDatabaseUrl,
    authToken: config.tursoAuthToken
  });

  if (LibsqlDatabase) {
    try {
      console.log(`[Database Engine] Connecting to Turso remote edge at ${config.tursoDatabaseUrl}`);
      db = new LibsqlDatabase(config.tursoDatabaseUrl, {
        authToken: config.tursoAuthToken
      });
      console.log('[Database Engine] Connected successfully to remote Turso edge SQLite');
    } catch (remoteErr) {
      console.warn('[Database Engine] Direct remote connection fell back to embedded replica with sync:', remoteErr.message);
      try {
        db = new LibsqlDatabase(config.dbPath, {
          syncUrl: config.tursoDatabaseUrl,
          authToken: config.tursoAuthToken
        });
        if (typeof db.sync === 'function') {
          db.sync();
        }
        console.log('[Database Engine] Initialized Turso embedded replica with syncUrl');
      } catch (replicaErr) {
        console.error('[Database Engine] Turso replica initialization failed:', replicaErr.message);
        throw replicaErr;
      }
    }
  } else {
    console.warn('[Database Engine] Native LibSQL package unavailable. Falling back to local engine while client is active.');
  }

  if (db) {
    db.tursoClient = tursoClient;
    db.client = tursoClient;
    db.isRemoteTurso = true;
  }
}

function openDatabaseWithRetry(DbConstructor, dbPath, maxRetries = 3, initialDelayMs = 250) {
  let attempt = 0;
  let delay = initialDelayMs;
  let lastError = null;

  while (attempt <= maxRetries) {
    try {
      const instance = new DbConstructor(dbPath);
      if (attempt > 0) {
        console.log(`[Local SQLite] Successfully opened database after ${attempt} retr${attempt === 1 ? 'y' : 'ies'}.`);
      }
      return instance;
    } catch (err) {
      lastError = err;
      attempt++;
      if (attempt <= maxRetries) {
        console.warn(`[Local SQLite] Warning opening ${path.basename(dbPath)} (attempt ${attempt}/${maxRetries}): ${err.message}. Retrying in ${delay}ms...`);
        try {
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
        } catch (_) {}
        delay *= 2; // exponential backoff
      }
    }
  }

  // If explicit in-memory fallback is requested by test environment
  if (process.env.ALLOW_IN_MEMORY_FALLBACK === 'true') {
    console.warn('[Local SQLite] ALLOW_IN_MEMORY_FALLBACK=true detected. Falling back to in-memory database.');
    return new DbConstructor(':memory:');
  }

  // Critical failure: NEVER delete or unlink user database files
  const criticalMsg = `[CRITICAL DATABASE ERROR] Failed to open SQLite database at "${dbPath}" after ${maxRetries} retries (${lastError?.message}). ` +
    `The database file has been PRESERVED to prevent data loss. ` +
    `Please ensure no other process (another instance, SQLite viewer, or file lock) is locking the file and restart the application.`;
  console.error(criticalMsg);
  throw new Error(criticalMsg);
}

if (!db) {
  if (DatabaseSync) {
    db = openDatabaseWithRetry(DatabaseSync, config.dbPath);
  } else if (LibsqlDatabase) {
    db = openDatabaseWithRetry(LibsqlDatabase, config.dbPath);
  } else {
    const errMsg = `SQLite engine is not available on Node.js ${process.version}. Please verify Node.js version >= 22.5.0 or install dependencies.`;
    console.error('[Database Error]', errMsg);
    const fail = () => { throw new Error(errMsg); };
    db = {
      prepare: () => ({ get: fail, all: fail, run: fail }),
      exec: fail
    };
  }

  try {
    if (process.env.VERCEL) {
      try { db.exec("PRAGMA journal_mode = DELETE;"); } catch (_) {}
    } else {
      try { db.exec("PRAGMA journal_mode = WAL;"); } catch (_) {}
    }
  } catch (_) {}
}

try {
  runMigrations(db);
} catch (migErr) {
  console.warn('[Database Migration Warning]:', migErr.message);
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS document_files (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      app_id INTEGER,
      type TEXT,
      name TEXT,
      mime_type TEXT,
      data TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
} catch (tableErr) {
  console.warn('[Database document_files table note]:', tableErr.message);
}

const COMPANIES = `Google|Mountain View|US
Meta|Menlo Park|US
Apple|Cupertino|US
Microsoft|Redmond|US
Amazon|Seattle|US
Netflix|Los Gatos|US
Nvidia|Santa Clara|US
Stripe|San Francisco|US
Figma|San Francisco|US
Airbnb|San Francisco|US
Uber|San Francisco|US
Dropbox|San Francisco|US
Databricks|San Francisco|US
Snowflake|Bozeman|US
OpenAI|San Francisco|US
Anthropic|San Francisco|US
Palantir|Denver|US
Salesforce|San Francisco|US
Adobe|San Jose|US
Oracle|Austin|US
IBM|Armonk|US
Intel|Santa Clara|US
Tesla|Austin|US
Coinbase|San Francisco|US
Robinhood|Menlo Park|US
Block|San Francisco|US
Shopify|Ottawa|CA
Spotify|Stockholm|SE
Klarna|Stockholm|SE
Revolut|London|GB
Wise|London|GB
Arm|Cambridge|GB
DeepMind|London|GB
SAP|Walldorf|DE
Siemens|Munich|DE
Zalando|Berlin|DE
Delivery Hero|Berlin|DE
Bosch|Gerlingen|DE
Grab|Singapore|SG
Sea Limited|Singapore|SG
Razer|Singapore|SG
ByteDance|Singapore|SG
Infosys|Bengaluru|IN
Flipkart|Bengaluru|IN
Razorpay|Bengaluru|IN
Zerodha|Bengaluru|IN
Swiggy|Bengaluru|IN
Jane Street|New York|US
Citadel|Chicago|US
Two Sigma|New York|US
Hudson River Trading|New York|US
Jump Trading|Chicago|US
D. E. Shaw|New York|US
Optiver|Amsterdam|NL
IMC Trading|Amsterdam|NL
Goldman Sachs|New York|US
JPMorgan Chase|New York|US
Morgan Stanley|New York|US
Barclays|London|GB
Deutsche Bank|Frankfurt|DE
UBS|Zurich|CH
Samsung|Seoul|KR
Sony|Tokyo|JP
Rakuten|Tokyo|JP
Atlassian|Sydney|AU`.split('\n').map(l => l.split('|'));

if (db && typeof db.prepare === 'function') {
  try {
    if (!db.prepare('select 1 from companies limit 1').get()) {
      const ins = db.prepare('insert into companies values(?,?,?)');
      COMPANIES.forEach(c => ins.run(...c));
    }
    if (!db.prepare("select 1 from settings where key='seeded'").get()) {
      db.prepare('insert or ignore into resume_profile(id) values(1)').run();
      db.prepare("insert or ignore into settings (key, value, user_id) values ('seeded', '1', 'default_user')").run();
    }
  } catch (seedErr) {
    console.warn('[Database Seed Warning]:', seedErr.message);
  }
}

const { encryptCredential, decryptCredential, migratePlaintextCredentials } = require('../services/cryptoService');

if (db && typeof db.prepare === 'function') {
  try {
    migratePlaintextCredentials(db);
  } catch (_) {}
}

const COLS = {
  applications: 'company role country city date_applied jd jd_url looking_for resume_version_id recruiter_name recruiter_email recruiter_notes visa deadline salary currency category portal_url portal_user portal_pass portal_notes custom_tags resume_path cover_letter_path'.split(' '),
  resume_profile: 'full_name email phone linkedin github school degree grad_date gpa skills projects experience'.split(' '),
  resume_versions: 'label region text pdf_name pdf_data'.split(' '),
};

const IMMUTABLE_FIELDS = ['user_id', 'id', 'created_at', 'updated_at'];

function cleanFilePath(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let p = raw.trim();
  p = p.replace(/^["'\s]+|["'\s]+$/g, '');
  if (p.startsWith('file:///')) p = decodeURIComponent(p.replace(/^file:\/\/\/?/, ''));
  p = p.replace(/^["'\s]+|["'\s]+$/g, '');
  return p;
}

function patch(table, id, body, userId = null) {
  if (!body || typeof body !== 'object' || !COLS[table]) return;

  // Shallow copy to prevent mutating caller object and strictly strip immutable keys
  const safeBody = { ...body };
  for (const field of IMMUTABLE_FIELDS) {
    delete safeBody[field];
  }

  if (table === 'applications') {
    if (safeBody.resume_path !== undefined) safeBody.resume_path = cleanFilePath(safeBody.resume_path);
    if (safeBody.cover_letter_path !== undefined) safeBody.cover_letter_path = cleanFilePath(safeBody.cover_letter_path);
    if (safeBody.portal_pass !== undefined && safeBody.portal_pass) {
      safeBody.portal_pass = encryptCredential(safeBody.portal_pass);
    }
  }

  const ks = Object.keys(safeBody).filter(k => COLS[table].includes(k));
  if (!ks.length) return;

  if (userId && userId !== 'default_user') {
    db.prepare(`update ${table} set ${ks.map(k => k + '=?').join(',')} where id=? and user_id=?`).run(...ks.map(k => safeBody[k]), id, userId);
  } else {
    db.prepare(`update ${table} set ${ks.map(k => k + '=?').join(',')} where id=?`).run(...ks.map(k => safeBody[k]), id);
  }
}

function runInTransaction(fn) {
  if (typeof db.transaction === 'function') {
    return db.transaction(fn)();
  }
  db.exec('BEGIN TRANSACTION;');
  try {
    const result = fn();
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    try { db.exec('ROLLBACK;'); } catch (_) {}
    throw err;
  }
}

function move(id, stage, before, userId = null) {
  const userClause = userId ? (userId !== 'default_user' ? ' and user_id=?' : ' and (user_id=? or user_id is null)') : '';
  const userParam = userId ? [userId] : [];

  const cur = db.prepare(`select stage from applications where id=?${userClause}`).get(id, ...userParam)?.stage;
  if (!cur) return;

  const ids = db.prepare(`select id from applications where stage=? and id!=?${userClause} order by position`).all(stage, id, ...userParam).map(r => r.id);
  let i = before ? ids.indexOf(+before) : -1;
  if (i < 0) i = ids.length;
  ids.splice(i, 0, id);

  const updateStmt = db.prepare(`update applications set stage=?, position=? where id=?${userClause}`);
  const logStmt = (cur !== stage)
    ? db.prepare("insert into activity_log(app_id, type, detail, user_id) values(?, 'stage_change', ?, ?)")
    : null;

  runInTransaction(() => {
    ids.forEach((x, p) => updateStmt.run(stage, p, x, ...userParam));
    if (logStmt) {
      logStmt.run(id, `Moved from ${cur} to ${stage}`, userId || 'default_user');
    }
  });
}

const getState = (userId = null) => {
  if (!userId) {
    return {
      apps: [],
      companies: db.prepare('select * from companies order by name').all(),
      roles: [],
      profile: null,
      versions: [],
      settings: {}
    };
  }

  let prof = db.prepare('select * from resume_profile where user_id=? limit 1').get(userId) || null;
  try {
    const userRow = db.prepare('select name, email from users where id=?').get(userId);
    if (!prof && userRow) {
      prof = {
        user_id: userId,
        full_name: userRow.name || (userRow.email ? userRow.email.split('@')[0] : ''),
        email: userRow.email || '',
        phone: '',
        linkedin: '',
        github: '',
        school: '',
        degree: '',
        grad_date: '',
        gpa: '',
        skills: '',
        projects: '',
        experience: '',
        gdrive_folder_id: ''
      };
    } else if (prof && (!prof.full_name || prof.full_name === 'Varun Chandra') && userRow && userRow.name && userRow.name !== 'Varun Chandra') {
      prof.full_name = userRow.name;
    }
  } catch (_) {}

  const rawApps = db.prepare('select * from applications where user_id=? order by position, id').all(userId);
  const decryptedApps = rawApps.map(app => {
    if (app.portal_pass) {
      return { ...app, portal_pass: decryptCredential(app.portal_pass) };
    }
    return app;
  });

  return {
    apps: decryptedApps,
    companies: db.prepare('select * from companies order by name').all(),
    roles: db.prepare("select name from roles where user_id=? order by name").all(userId).map(r => r.name),
    profile: prof,
    versions: db.prepare("select id,label,region,text,pdf_name,(pdf_data!='') as has_pdf from resume_versions where user_id=? order by id").all(userId),
    settings: Object.fromEntries(db.prepare('select * from settings where user_id=?').all(userId).map(r => [r.key, r.value])),
  };
};

module.exports = {
  db,
  tursoClient,
  cleanFilePath,
  patch,
  move,
  getState,
  performDbBackup,
  encryptCredential,
  decryptCredential,
  runInTransaction,
  openDatabaseWithRetry
};
