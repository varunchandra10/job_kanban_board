const { db, patch } = require('../database/db');

exports.updateProfile = (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    // Ensure profile row exists for this user
    let existing = db.prepare("select id from resume_profile where user_id=? limit 1").get(userId);
    let targetId;
    if (!existing) {
      const r = db.prepare("insert or ignore into resume_profile(user_id) values(?)").run(userId);
      existing = db.prepare("select id from resume_profile where user_id=? limit 1").get(userId);
      targetId = existing ? existing.id : Number(r.lastInsertRowid);
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
    db.prepare('update applications set resume_version_id=null where resume_version_id=? and user_id=?').run(id, userId);
    db.prepare('delete from resume_versions where id=? and user_id=?').run(id, userId);
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};

exports.getVersionPdf = (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    const id = parseInt(req.params.id, 10);
    const r = db.prepare('select pdf_data from resume_versions where id=? and user_id=?').get(id, userId);
    if (!r || !r.pdf_data) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    const dataStr = r.pdf_data.includes(',') ? r.pdf_data.split(',')[1] : r.pdf_data;
    const pdfBuffer = Buffer.from(dataStr, 'base64');
    if (!pdfBuffer.length) {
      return res.status(404).json({ error: 'PDF is empty' });
    }
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
    db.prepare('insert into settings(key, value, user_id) values(?,?,?) on conflict(key, user_id) do update set value=excluded.value').run(
      key,
      value,
      userId
    );
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};
