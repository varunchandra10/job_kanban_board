// Vercel Serverless Function entry point
let app;
let initError = null;

try {
  app = require('../backend/src/app');
} catch (err) {
  initError = err;
  console.error('[Vercel Function Init Error]', err);
}

module.exports = (req, res) => {
  if (initError) {
    return res.status(500).json({
      error: 'Serverless initialization error: ' + (initError.message || String(initError)),
      stack: initError.stack
    });
  }
  return app(req, res);
};
