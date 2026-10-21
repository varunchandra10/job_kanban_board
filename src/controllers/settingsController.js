const { db, patch } = require('../database/db');

exports.updateProfile = (req, res, next) => {
  try {
    patch('resume_profile', 1, req.body);
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};

exports.createVersion = (req, res, next) => {
  try {
    const { label, region } = req.body;
    const r = db.prepare('insert into resume_versions(label,region) values(?,?)').run(label || 'New version', region || '');
    const created = db.prepare('select id,label,region,text,pdf_name,0 as has_pdf from resume_versions where id=?').get(Number(r.lastInsertRowid));
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

exports.updateVersion = (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    patch('resume_versions', id, req.body);
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};

exports.deleteVersion = (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    db.prepare('update applications set resume_version_id=null where resume_version_id=?').run(id);
    db.prepare('delete from resume_versions where id=?').run(id);
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
    const key = req.params.key;
    const { value } = req.body;
    db.prepare('insert into settings values(?,?) on conflict(key) do update set value=excluded.value').run(key, value);
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};
