const { db } = require('../database/db');

exports.addRole = (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    const { name } = req.body;
    if (name) {
      db.prepare("insert or ignore into roles(name, user_id) values(?, ?)").run(name.trim(), userId);
    }
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};

exports.addCompany = (req, res, next) => {
  try {
    const { name, city, country } = req.body;
    if (name) {
      db.prepare('insert or ignore into companies values(?,?,?)').run(name.trim(), city || '', country || '');
    }
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};
