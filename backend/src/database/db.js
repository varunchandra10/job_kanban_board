const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { runMigrations } = require('./migrator');

function performDbBackup() {
  if (!fs.existsSync(config.dbPath)) return;
  try {
    const backupDir = path.join(config.rootDir, 'backups');
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

performDbBackup();
setInterval(performDbBackup, 24 * 60 * 60 * 1000).unref();

const db = new DatabaseSync(config.dbPath);

try {
  db.exec("PRAGMA journal_mode = WAL;");
} catch (_) {}

runMigrations(db);

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

if (!db.prepare('select 1 from companies limit 1').get()) {
  const ins = db.prepare('insert into companies values(?,?,?)');
  COMPANIES.forEach(c => ins.run(...c));
}
if (!db.prepare("select 1 from settings where key='seeded'").get()) {
  db.prepare('insert or ignore into resume_profile(id) values(1)').run();
  const rv = db.prepare('insert into resume_versions(label,region) values(?,?)');
  const v1 = rv.run('SWE - US', 'United States').lastInsertRowid, v2 = rv.run('Quant - UK CV', 'United Kingdom').lastInsertRowid;
  const seed = [
    ['Google', 'Software Engineer Intern', 'US', 'Mountain View', '2026-09-18', 'Applied', v1],
    ['Stripe', 'Backend Engineer Intern', 'US', 'San Francisco', '2026-09-02', 'Applied', v1],
    ['Razorpay', 'Product Engineering Intern', 'IN', 'Bengaluru', '2026-09-05', 'Applied', null],
    ['Jane Street', 'Quantitative Trading Intern', 'GB', 'London', '2026-09-10', 'Interviewing', v2],
    ['Grab', 'Data Science Intern', 'SG', 'Singapore', '2026-08-29', 'Interviewing', null],
    ['SAP', 'Software Engineering Intern', 'DE', 'Walldorf', '2026-08-20', 'Offer', v1],
    ['Citadel', 'Quant Research Intern', 'US', 'Chicago', '2026-07-30', 'Rejected', v2],
  ];
  const pos = {}, ia = db.prepare('insert into applications(company,role,country,city,date_applied,stage,position,resume_version_id) values(?,?,?,?,?,?,?,?)');
  const ir = db.prepare('insert or ignore into roles values(?)');
  seed.forEach(s => { pos[s[5]] = (pos[s[5]] ?? -1) + 1; ia.run(s[0], s[1], s[2], s[3], s[4], s[5], pos[s[5]], s[6]); ir.run(s[1]); });
  db.prepare("insert into settings values('seeded','1')").run();
}

const COLS = {
  applications: 'company role country city date_applied jd jd_url looking_for resume_version_id recruiter_name recruiter_email recruiter_notes visa deadline salary currency category portal_url portal_user portal_pass portal_notes custom_tags resume_path cover_letter_path'.split(' '),
  resume_profile: 'full_name email phone linkedin github school degree grad_date gpa skills projects experience'.split(' '),
  resume_versions: 'label region text pdf_name pdf_data'.split(' '),
};

function cleanFilePath(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let p = raw.trim();
  p = p.replace(/^["'\s]+|["'\s]+$/g, '');
  if (p.startsWith('file:///')) p = decodeURIComponent(p.replace(/^file:\/\/\/?/, ''));
  p = p.replace(/^["'\s]+|["'\s]+$/g, '');
  return p;
}

function patch(table, id, body) {
  if (table === 'applications') {
    if (body.resume_path !== undefined) body.resume_path = cleanFilePath(body.resume_path);
    if (body.cover_letter_path !== undefined) body.cover_letter_path = cleanFilePath(body.cover_letter_path);
  }
  const ks = Object.keys(body).filter(k => COLS[table].includes(k));
  if (!ks.length) return;
  db.prepare(`update ${table} set ${ks.map(k => k + '=?').join(',')} where id=?`).run(...ks.map(k => body[k]), id);
}

function move(id, stage, before) {
  const cur = db.prepare('select stage from applications where id=?').get(id)?.stage;
  const ids = db.prepare('select id from applications where stage=? and id!=? order by position').all(stage, id).map(r => r.id);
  let i = before ? ids.indexOf(+before) : -1;
  if (i < 0) i = ids.length;
  ids.splice(i, 0, id);
  const up = db.prepare('update applications set stage=?, position=? where id=?');
  ids.forEach((x, p) => up.run(stage, p, x));
  if (cur && cur !== stage) {
    db.prepare("insert into activity_log(app_id, type, detail) values(?, 'stage_change', ?)").run(id, `Moved from ${cur} to ${stage}`);
  }
}

const getState = () => ({
  apps: db.prepare('select * from applications order by position, id').all(),
  companies: db.prepare('select * from companies order by name').all(),
  roles: db.prepare('select name from roles order by name').all().map(r => r.name),
  profile: db.prepare('select * from resume_profile where id=1').get(),
  versions: db.prepare("select id,label,region,text,pdf_name,(pdf_data!='') as has_pdf from resume_versions order by id").all(),
  settings: Object.fromEntries(db.prepare('select * from settings').all().map(r => [r.key, r.value])),
});

module.exports = {
  db,
  cleanFilePath,
  patch,
  move,
  getState,
  performDbBackup
};
