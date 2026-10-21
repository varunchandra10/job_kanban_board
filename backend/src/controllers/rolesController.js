const { db } = require('../database/db');

exports.addRole = (req, res, next) => {
  try {
    const { name } = req.body;
    if (name) {
      db.prepare('insert or ignore into roles values(?)').run(name.trim());
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
