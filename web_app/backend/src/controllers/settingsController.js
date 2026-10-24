const { db, patch } = require('../database/db');

exports.updateProfile = (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    // Ensure profile row exists for this user
    const existing = db.prepare("select id from resume_profile where user_id=? limit 1").get(userId);
    let targetId = 1;
    if (!existing) {
      if (userId === 'default_user') {
        db.prepare("insert or ignore into resume_profile(id, user_id) values(1, 'default_user')").run();
        targetId = 1;
      } else {
        const r = db.prepare("insert into resume_profile(user_id) values(?)").run(userId);
        targetId = Number(r.lastInsertRowid);
      }
    } else {
      targetId = existing.id;
    }

    patch('resume_profile', targetId, req.body, userId);
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};

exports.createVersion = (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { label, region } = req.body;
    const r = db.prepare('insert into resume_versions(label, region, user_id) values(?,?,?)').run(
      label || 'New version',
      region || '',
      userId
    );
    const created = db.prepare("select id,label,region,text,pdf_name,0 as has_pdf from resume_versions where id=?").get(Number(r.lastInsertRowid));
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

exports.updateVersion = (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    const id = parseInt(req.params.id, 10);
    patch('resume_versions', id, req.body, userId);
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};

exports.deleteVersion = (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    const id = parseInt(req.params.id, 10);
    db.prepare('update applications set resume_version_id=null where resume_version_id=?').run(id);
    if (userId !== 'default_user') {
      db.prepare('delete from resume_versions where id=? and user_id=?').run(id, userId);
    } else {
      db.prepare('delete from resume_versions where id=?').run(id);
    }
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};

exports.getVersionPdf = (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const r = db.prepare('select pdf_data from resume_versions where id=?').get(id);
    if (!r || !r.pdf_data || !r.pdf_data.includes(',')) {
      return res.status(404).json({});
    }
    const pdfBuffer = Buffer.from(r.pdf_data.split(',')[1], 'base64');
    res.writeHead(200, {
      'content-type': 'application/pdf',
      'content-length': pdfBuffer.length
    });
    res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

exports.updateSetting = (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    const key = req.params.key;
    const { value } = req.body;
    db.prepare('insert into settings(key, value, user_id) values(?,?,?) on conflict(key) do update set value=excluded.value, user_id=excluded.user_id').run(
      key,
      value,
      userId
    );
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};
