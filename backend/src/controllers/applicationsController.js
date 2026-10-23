const { db, patch, move, getState } = require('../database/db');

exports.getState = (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    res.json(getState(userId));
  } catch (err) {
    next(err);
  }
};

exports.getActivity = (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    const appId = parseInt(req.params.id, 10);
    const app = db.prepare("select id from applications where id=? and (user_id=? or user_id='default_user')").get(appId, userId);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const logs = db.prepare('select * from activity_log where app_id=? order by id desc').all(appId);
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

exports.addActivity = (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    const b = req.body;
    db.prepare("insert into activity_log(app_id, type, detail, ts, user_id) values(?,?,?,coalesce(?,datetime('now')),?)").run(
      b.app_id,
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
    const userId = req.user?.id || 'default_user';
    const b = req.body;
    const minRow = db.prepare("select coalesce(min(position),0)-1 as p from applications where stage='Applied' and (user_id=? or user_id='default_user')").get(userId);
    const min = minRow ? minRow.p : 0;
    const cat = b.category || 'Industry';

    const r = db.prepare("insert into applications(company,role,country,city,date_applied,stage,position,category,portal_url,portal_user,portal_pass,portal_notes,custom_tags,user_id) values(?,?,?,?,?,'Applied',?,?,?,?,?,?,?,?)")
      .run(b.company, b.role || '', b.country || '', b.city || '', b.date_applied || '', min, cat, b.portal_url || '', b.portal_user || '', b.portal_pass || '', b.portal_notes || '', b.custom_tags || '', userId);

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

    const created = db.prepare('select * from applications where id=?').get(id);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

exports.updateApplication = (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    const id = parseInt(req.params.id, 10);
    patch('applications', id, req.body, userId);
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};

exports.deleteApplication = (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    const id = parseInt(req.params.id, 10);
    if (userId !== 'default_user') {
      db.prepare('delete from applications where id=? and user_id=?').run(id, userId);
    } else {
      db.prepare('delete from applications where id=?').run(id);
    }
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};

exports.moveApplication = (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    const id = parseInt(req.params.id, 10);
    const { stage, before } = req.body;
    move(id, stage, before, userId);
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};
