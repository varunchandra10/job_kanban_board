// Internship Tracker backend — Node 22+, built-in node:sqlite, no npm dependencies.
const { DatabaseSync } = require('node:sqlite');
const http = require('http'), fs = require('fs'), path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'tracker.db'));
db.exec(`
create table if not exists applications(
  id integer primary key autoincrement, company text not null, role text default '', country text default '',
  city text default '', date_applied text default '', stage text default 'Applied', position integer default 0,
  jd text default '', jd_url text default '', looking_for text default '', resume_version_id integer,
  recruiter_name text default '', recruiter_email text default '', recruiter_notes text default '',
  visa text default '', deadline text default '', salary text default '', currency text default '',
  category text default 'Industry', portal_url text default '', portal_user text default '', portal_pass text default '', portal_notes text default '',
  custom_tags text default '', resume_path text default '', cover_letter_path text default '');
create table if not exists resume_profile(
  id integer primary key check(id=1), full_name text default '', email text default '', phone text default '',
  linkedin text default '', github text default '', school text default '', degree text default '',
  grad_date text default '', gpa text default '', skills text default '', projects text default '', experience text default '');
create table if not exists resume_versions(
  id integer primary key autoincrement, label text default 'New version', region text default '',
  text text default '', pdf_name text default '', pdf_data text default '');
create table if not exists companies(name text primary key, city text, country text);
create table if not exists roles(name text primary key);
create table if not exists settings(key text primary key, value text);
create table if not exists activity_log(
  id integer primary key autoincrement,
  app_id integer not null,
  type text default 'stage_change',
  detail text default '',
  ts text default (datetime('now'))
);
`);

// ---- database migration (for existing databases) ----
const appCols = db.prepare('pragma table_info(applications)').all().map(c => c.name);
['category', 'portal_url', 'portal_user', 'portal_pass', 'portal_notes', 'custom_tags', 'resume_path', 'cover_letter_path'].forEach(col => {
  if (!appCols.includes(col)) {
    db.prepare(`alter table applications add column ${col} text default ''`).run();
  }
});

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

// ---- seed (first run only) ----
if (!db.prepare('select 1 from companies limit 1').get()) {
  const ins = db.prepare('insert into companies values(?,?,?)');
  COMPANIES.forEach(c => ins.run(...c));
}
if (!db.prepare("select 1 from settings where key='seeded'").get()) {
  db.prepare('insert or ignore into resume_profile(id) values(1)').run();
  const rv = db.prepare('insert into resume_versions(label,region) values(?,?)');
  const v1 = rv.run('SWE – US', 'United States').lastInsertRowid, v2 = rv.run('Quant – UK CV', 'United Kingdom').lastInsertRowid;
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
// Seed default categories and sample Government & Research applications
if (!db.prepare("select 1 from settings where key='seeded_sections'").get()) {
  db.prepare("update applications set category='Industry' where category is null or category=''").run();
  const v1 = db.prepare('select id from resume_versions limit 1').get()?.id || null;
  const ia = db.prepare('insert into applications(company,role,country,city,date_applied,stage,position,resume_version_id,category,portal_url,portal_user,portal_pass,portal_notes) values(?,?,?,?,?,?,?,?,?,?,?,?,?)');
  ia.run('NASA JPL', 'Software Engineering Intern', 'US', 'Pasadena', '2026-09-15', 'Applied', 99, v1, 'Government', 'https://intern.nasa.gov', 'astro_applicant_42', 'NasaPortal#2026', 'Login portal via USAJOBS / NASA OSTEM; Security clearance checklist pending');
  ia.run('CERN', 'Computing Summer Student Fellow', 'CH', 'Geneva', '2026-09-10', 'Interviewing', 99, v1, 'Research', 'https://careers.smartrecruiters.com/cern', 'cern_res_user9', 'Quantum#Res2026', 'Academic portal; 2 reference letters submitted');
  db.prepare("insert or ignore into companies values('NASA JPL', 'Pasadena', 'US')").run();
  db.prepare("insert or ignore into companies values('CERN', 'Geneva', 'CH')").run();
  db.prepare("insert or ignore into roles values('Software Engineering Intern')").run();
  db.prepare("insert or ignore into roles values('Computing Summer Student Fellow')").run();
  db.prepare("insert into settings values('seeded_sections','1')").run();
}
if (!db.prepare("select 1 from settings where key='seeded_phase1'").get()) {
  db.prepare("update applications set custom_tags='Dream Job:#f43f5e,Referral:#6366f1' where company='Google'").run();
  db.prepare("update applications set deadline='2026-10-08', custom_tags='Cold Apply:#06b6d4' where company='Stripe'").run();
  db.prepare("update applications set deadline='2026-10-02', custom_tags='OA Pending:#a855f7' where company='Razorpay'").run();
  db.prepare("update applications set custom_tags='High Priority:#f59e0b,Security Clearance:#6366f1' where company='NASA JPL'").run();
  db.prepare("insert into settings values('seeded_phase1','1')").run();
}
if (!db.prepare("select 1 from settings where key='seeded_phase2'").get()) {
  const apps = db.prepare('select id, company, role, stage, date_applied from applications').all();
  const ins = db.prepare('insert into activity_log(app_id, type, detail, ts) values(?,?,?,?)');
  apps.forEach(a => {
    ins.run(a.id, 'created', `Application recorded for ${a.role || 'Internship'} at ${a.company}`, (a.date_applied || '2026-09-01') + ' 09:30:00');
    if (a.stage === 'Interviewing' || a.stage === 'Offer' || a.stage === 'Rejected') {
      ins.run(a.id, 'stage_change', 'Moved to Interviewing · Recruiter screened', '2026-09-18 14:15:00');
    }
    if (a.stage === 'Offer') {
      ins.run(a.id, 'stage_change', 'Moved to Offer · Received written offer package 🎉', '2026-09-28 16:45:00');
    }
    if (a.stage === 'Rejected') {
      ins.run(a.id, 'stage_change', 'Moved to Rejected · Position filled', '2026-09-25 11:00:00');
    }
  });
  db.prepare("insert into settings values('seeded_phase2','1')").run();
}

// ---- helpers ----
const COLS = {
  applications: 'company role country city date_applied jd jd_url looking_for resume_version_id recruiter_name recruiter_email recruiter_notes visa deadline salary currency category portal_url portal_user portal_pass portal_notes custom_tags resume_path cover_letter_path'.split(' '),
  resume_profile: 'full_name email phone linkedin github school degree grad_date gpa skills projects experience'.split(' '),
  resume_versions: 'label region text pdf_name pdf_data'.split(' '),
};
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
const state = () => ({
  apps: db.prepare('select * from applications order by position, id').all(),
  companies: db.prepare('select * from companies order by name').all(),
  roles: db.prepare('select name from roles order by name').all().map(r => r.name),
  profile: db.prepare('select * from resume_profile where id=1').get(),
  versions: db.prepare("select id,label,region,text,pdf_name,(pdf_data!='') as has_pdf from resume_versions order by id").all(),
  settings: Object.fromEntries(db.prepare('select * from settings').all().map(r => [r.key, r.value])),
});

function route(method, url, b) {
  let m;
  if (method === 'POST' && url === '/shutdown') {
    setTimeout(() => {
      console.log('Shutting down server on request...');
      process.exit(0);
    }, 400);
    return { ok: 1 };
  }
  if (method === 'GET' && url === '/state') return state();
  if (method === 'GET' && (m = url.match(/^\/activity\/(\d+)$/))) {
    return db.prepare('select * from activity_log where app_id=? order by id desc').all(+m[1]);
  }
  if (method === 'POST' && url === '/activity') {
    db.prepare("insert into activity_log(app_id, type, detail, ts) values(?,?,?,coalesce(?,datetime('now')))").run(
      b.app_id, b.type || 'stage_change', b.detail || '', b.ts || null
    );
    return { ok: 1 };
  }
  if (method === 'POST' && url === '/applications') {
    const min = db.prepare("select coalesce(min(position),0)-1 as p from applications where stage='Applied'").get().p;
    const cat = b.category || 'Industry';
    const r = db.prepare("insert into applications(company,role,country,city,date_applied,stage,position,category,portal_url,portal_user,portal_pass,portal_notes,custom_tags) values(?,?,?,?,?,'Applied',?,?,?,?,?,?,?)")
      .run(b.company, b.role || '', b.country || '', b.city || '', b.date_applied || '', min, cat, b.portal_url || '', b.portal_user || '', b.portal_pass || '', b.portal_notes || '', b.custom_tags || '');
    const id = Number(r.lastInsertRowid);
    patch('applications', id, b);
    if (b.stage && b.stage !== 'Applied') move(id, b.stage, null); // used by undo-delete
    if (b.role) db.prepare('insert or ignore into roles values(?)').run(b.role);
    db.prepare("insert into activity_log(app_id, type, detail) values(?, 'created', ?)").run(id, `Application submitted for ${b.role || 'role'} at ${b.company}`);
    return db.prepare('select * from applications where id=?').get(id);
  }
  if ((m = url.match(/^\/applications\/(\d+)$/))) {
    if (method === 'PATCH') { patch('applications', +m[1], b); return { ok: 1 }; }
    if (method === 'DELETE') { db.prepare('delete from applications where id=?').run(+m[1]); return { ok: 1 }; }
  }
  if (method === 'POST' && (m = url.match(/^\/applications\/(\d+)\/move$/))) { move(+m[1], b.stage, b.before); return { ok: 1 }; }
  if (method === 'PATCH' && url === '/profile') { patch('resume_profile', 1, b); return { ok: 1 }; }
  if (method === 'POST' && url === '/versions')
    return db.prepare('select id,label,region,text,pdf_name,0 as has_pdf from resume_versions where id=?')
      .get(Number(db.prepare('insert into resume_versions(label,region) values(?,?)').run(b.label || 'New version', b.region || '').lastInsertRowid));
  if ((m = url.match(/^\/versions\/(\d+)$/))) {
    if (method === 'PATCH') { patch('resume_versions', +m[1], b); return { ok: 1 }; }
    if (method === 'DELETE') {
      db.prepare('update applications set resume_version_id=null where resume_version_id=?').run(+m[1]);
      db.prepare('delete from resume_versions where id=?').run(+m[1]); return { ok: 1 };
    }
  }
  if (method === 'POST' && url === '/roles') { db.prepare('insert or ignore into roles values(?)').run(b.name); return { ok: 1 }; }
  if (method === 'PUT' && (m = url.match(/^\/settings\/(\w+)$/))) {
    db.prepare('insert into settings values(?,?) on conflict(key) do update set value=excluded.value').run(m[1], b.value); return { ok: 1 };
  }
  if (method === 'POST' && url === '/companies') {
    db.prepare('insert or ignore into companies values(?,?,?)').run(b.name, b.city || '', b.country || ''); return { ok: 1 };
  }
  if (method === 'POST' && url === '/file-info') {
    const p = resolveSafePath(b.path);
    if (!p || !fs.existsSync(p)) return { exists: false, error: 'File not found', resolvedPath: p };
    try {
      const st = fs.statSync(p);
      return {
        exists: true,
        name: path.basename(p),
        size: st.size,
        ext: path.extname(p).toLowerCase(),
        mtime: st.mtime,
        resolvedPath: p
      };
    } catch (e) {
      return { exists: false, error: String(e), resolvedPath: p };
    }
  }
  if (method === 'POST' && url === '/open-file') {
    const p = resolveSafePath(b.path);
    if (!p || !fs.existsSync(p)) return { ok: 0, error: 'File not found' };
    const { exec } = require('child_process');
    if (process.platform === 'win32') {
      exec(`start "" "${p}"`);
    } else if (process.platform === 'darwin') {
      exec(`open "${p}"`);
    } else {
      exec(`xdg-open "${p}"`);
    }
    return { ok: 1 };
  }
  if (method === 'POST' && url === '/reveal-file') {
    const p = resolveSafePath(b.path);
    if (!p || !fs.existsSync(p)) return { ok: 0, error: 'File not found' };
    const { exec } = require('child_process');
    if (process.platform === 'win32') {
      exec(`explorer /select,"${p}"`);
    } else if (process.platform === 'darwin') {
      exec(`open -R "${p}"`);
    }
    return { ok: 1 };
  }
  if (method === 'POST' && url === '/upload-document') {
    try {
      if (!b || !b.data) return { error: 'No file data received' };
      const isCover = b.type === 'cover_letter' || b.targetKey === 'cover_letter_path';
      const subfolder = isCover ? path.join('documents', 'cover_letter') : path.join('documents', 'resume');
      const targetDir = path.resolve(__dirname, subfolder);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

      const rawName = (b.name || (isCover ? 'cover_letter.docx' : 'resume.pdf')).replace(/[^a-zA-Z0-9._ -]/g, '_');
      const dest = path.join(targetDir, rawName);
      const data = b.data.includes(',') ? b.data.split(',')[1] : b.data;
      fs.writeFileSync(dest, Buffer.from(data, 'base64'));

      if (b.appId) {
        const col = isCover ? 'cover_letter_path' : 'resume_path';
        try {
          db.prepare(`update applications set ${col}=? where id=?`).run(dest, Number(b.appId));
        } catch (dbErr) {
          console.warn('DB update warning on upload:', dbErr);
        }
      }

      return { ok: 1, fullPath: dest, path: dest, relativePath: dest, name: rawName };
    } catch (err) {
      console.error('Upload handling error:', err);
      return { error: String(err.message || err) };
    }
  }
  return null;
}

function cleanFilePath(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let p = raw.trim();
  p = p.replace(/^["'\s]+|["'\s]+$/g, '');
  if (p.startsWith('file:///')) p = decodeURIComponent(p.replace(/^file:\/\/\/?/, ''));
  p = p.replace(/^["'\s]+|["'\s]+$/g, '');
  return p;
}

function resolveSafePath(inputPath) {
  let p = cleanFilePath(inputPath);
  if (!p || p.toUpperCase() === 'NA') return null;
  if (!path.isAbsolute(p)) {
    p = path.resolve(__dirname, p);
  } else {
    p = path.normalize(p);
  }
  return p;
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.pdf': return 'application/pdf';
    case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.doc': return 'application/msword';
    case '.txt': case '.log': return 'text/plain; charset=utf-8';
    case '.md': return 'text/markdown; charset=utf-8';
    case '.html': case '.htm': return 'text/html; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg': case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const send = (code, body, type = 'application/json') => { res.writeHead(code, { 'content-type': type }); res.end(body); };

  if (url === '/shutdown' || url === '/api/shutdown') {
    send(200, JSON.stringify({ ok: 1, message: 'Server is stopping' }));
    console.log('Server shutting down on request...');
    setTimeout(() => {
      try { server.close(); } catch (e) {}
      if (process.platform === 'win32' && process.ppid) {
        try {
          const { exec } = require('child_process');
          exec(`powershell -NoProfile -Command "(Get-Process -Id ${process.ppid} -ErrorAction SilentlyContinue).ProcessName"`, (err, stdout) => {
            const pName = (stdout || '').trim().toLowerCase();
            // If launched from a cmd or terminal window, close that window automatically
            if (pName === 'cmd' || pName === 'windowsterminal') {
              exec(`taskkill /F /PID ${process.ppid}`);
            }
            process.exit(0);
          });
          setTimeout(() => process.exit(0), 400);
          return;
        } catch (e) {}
      }
      process.exit(0);
    }, 120);
    return;
  }
  if (url.startsWith('/vendor/')) {
    const vPath = path.join(__dirname, url);
    if (fs.existsSync(vPath) && fs.statSync(vPath).isFile()) {
      const ext = path.extname(vPath).toLowerCase();
      const mime = ext === '.js' ? 'application/javascript; charset=utf-8' :
                   ext === '.css' ? 'text/css; charset=utf-8' : 'application/octet-stream';
      res.writeHead(200, { 'content-type': mime, 'cache-control': 'public, max-age=86400' });
      return res.end(fs.readFileSync(vPath));
    }
  }
  if (url === '/api/file-content') {
    const parsedUrl = new URL(req.url, 'http://localhost');
    const target = resolveSafePath(parsedUrl.searchParams.get('path'));
    if (!target || !fs.existsSync(target)) {
      return send(404, JSON.stringify({ error: 'File not found', path: target }));
    }
    try {
      const stats = fs.statSync(target);
      if (!stats.isFile()) return send(400, JSON.stringify({ error: 'Target is not a file' }));
      const mime = getMimeType(target);
      const filename = path.basename(target);
      res.writeHead(200, {
        'content-type': mime,
        'content-length': stats.size,
        'content-disposition': `inline; filename="${encodeURIComponent(filename)}"`,
        'cache-control': 'no-cache',
        'access-control-allow-origin': '*'
      });
      return fs.createReadStream(target).pipe(res);
    } catch (err) {
      return send(500, JSON.stringify({ error: String(err) }));
    }
  }
  if (url.startsWith('/api/')) {
    let raw = '';
    req.on('data', c => raw += c);
    req.on('end', () => {
      try {
        const pm = url.match(/^\/api\/versions\/(\d+)\/pdf$/);
        if (pm) {
          const r = db.prepare('select pdf_data from resume_versions where id=?').get(+pm[1]);
          if (!r || !r.pdf_data || !r.pdf_data.includes(',')) return send(404, '{}');
          return send(200, Buffer.from(r.pdf_data.split(',')[1], 'base64'), 'application/pdf');
        }
        const out = route(req.method, url.slice(4), raw ? JSON.parse(raw) : {});
        out === null ? send(404, '{"error":"not found"}') : send(200, JSON.stringify(out));
      } catch (e) { console.error(e); send(500, JSON.stringify({ error: String(e) })); }
    });
    return;
  }
  const staticFiles = {
    '/': { file: 'index.html', mime: 'text/html; charset=utf-8' },
    '/index.html': { file: 'index.html', mime: 'text/html; charset=utf-8' },
    '/style.css': { file: 'style.css', mime: 'text/css; charset=utf-8' },
    '/logos.json': { file: 'logos.json', mime: 'application/json' },
  };
  const entry = staticFiles[url];
  if (!entry) return send(404, 'Not found', 'text/plain');
  try {
    res.writeHead(200, { 'content-type': entry.mime, 'cache-control': 'no-cache, no-store, must-revalidate' });
    res.end(fs.readFileSync(path.join(__dirname, entry.file)));
  } catch {
    send(404, 'Not found', 'text/plain');
  }
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Internship Tracker running at http://localhost:${PORT}`));
