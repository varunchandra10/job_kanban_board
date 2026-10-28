const { db, patch, move, getState, encryptCredential, decryptCredential } = require('../database/db');
const config = require('../config');

function getEffectiveUserId(req) {
  return req.user?.id || null;
}

exports.getState = (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    if (!userId) {
      return res.json({
        apps: [],
        companies: [],
        roles: [],
        profile: null,
        versions: [],
        settings: {}
      });
    }
    res.json(getState(userId));
  } catch (err) {
    next(err);
  }
};

exports.getActivity = (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    if (!userId) return res.json([]);
    const appId = parseInt(req.params.id, 10);
    const app = db.prepare("select id from applications where id=? and user_id=?").get(appId, userId);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const logs = db.prepare('select * from activity_log where app_id=? and user_id=? order by id desc').all(appId, userId);
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

exports.addActivity = (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    if (!userId) return res.status(401).json({ error: 'Please log in' });
    const b = req.body;
    const appId = parseInt(b.app_id, 10);
    const app = db.prepare('select id from applications where id=? and user_id=?').get(appId, userId);
    if (!app) {
      return res.status(404).json({ error: 'Application not found or unauthorized' });
    }
    db.prepare("insert into activity_log(app_id, type, detail, ts, user_id) values(?,?,?,coalesce(?,datetime('now')),?)").run(
      appId,
      b.type || 'stage_change',
      b.detail || '',
      b.ts || null,
      userId
    );
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};

exports.createApplication = (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    if (!userId) return res.status(401).json({ error: 'Please log in to add applications', loggedOut: true });
    const b = { ...(req.body || {}) };
    delete b.user_id;
    delete b.id;

    const minRow = db.prepare("select coalesce(min(position),0)-1 as p from applications where stage='Applied' and user_id=?").get(userId);
    const min = minRow ? minRow.p : 0;
    const cat = b.category || 'Industry';
    const portalPass = b.portal_pass ? encryptCredential(b.portal_pass) : '';

    const r = db.prepare("insert into applications(company,role,country,city,date_applied,stage,position,category,portal_url,portal_user,portal_pass,portal_notes,custom_tags,user_id) values(?,?,?,?,?,'Applied',?,?,?,?,?,?,?,?)")
      .run(b.company, b.role || '', b.country || '', b.city || '', b.date_applied || '', min, cat, b.portal_url || '', b.portal_user || '', portalPass, b.portal_notes || '', b.custom_tags || '', userId);

    const id = Number(r.lastInsertRowid);
    patch('applications', id, b, userId);

    if (b.stage && b.stage !== 'Applied') {
      move(id, b.stage, null, userId);
    }
    if (b.role) {
      db.prepare("insert or ignore into roles(name, user_id) values(?,?)").run(b.role, userId);
    }
    db.prepare("insert into activity_log(app_id, type, detail, user_id) values(?, 'created', ?, ?)").run(
      id,
      `Application submitted for ${b.role || 'role'} at ${b.company}`,
      userId
    );

    const created = db.prepare('select * from applications where id=? and user_id=?').get(id, userId);
    if (created && created.portal_pass) {
      created.portal_pass = decryptCredential(created.portal_pass);
    }
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

exports.updateApplication = (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    if (!userId) return res.status(401).json({ error: 'Please log in' });
    const id = parseInt(req.params.id, 10);
    const b = { ...(req.body || {}) };
    delete b.user_id;
    delete b.id;
    patch('applications', id, b, userId);
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};

exports.deleteApplication = (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    if (!userId) return res.status(401).json({ error: 'Please log in' });
    const id = parseInt(req.params.id, 10);
    db.prepare('delete from applications where id=? and user_id=?').run(id, userId);
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};

exports.moveApplication = (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    if (!userId) return res.status(401).json({ error: 'Please log in' });
    const id = parseInt(req.params.id, 10);
    const { stage, before } = req.body;
    move(id, stage, before, userId);
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};
