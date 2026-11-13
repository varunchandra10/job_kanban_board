const express = require('express');
const router = express.Router();
const clipperController = require('../controllers/clipperController');

// Pre-flight CORS for browser bookmarklets running on external websites
router.options('/quick-add', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

// Universal 1-Click Job Clipper quick add endpoint
router.post('/quick-add', (req, res, next) => {
  // Set CORS headers specifically for the clipper request
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  clipperController.quickAdd(req, res, next);
});

module.exports = router;

