const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const { createRateLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const applicationsRoutes = require('./routes/applications');
const documentsRoutes = require('./routes/documents');
const rolesRoutes = require('./routes/roles');
const settingsRoutes = require('./routes/settings');
const backupRoutes = require('./routes/backup');
const learningsRoutes = require('./routes/learnings');

const app = express();

app.use(cors());
app.use('/api', createRateLimiter({ windowMs: 60 * 1000, max: 500 }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const healthHandler = (req, res) => {
  let sqliteOk = false;
  try {
    const { db } = require('./database/db');
    sqliteOk = !!db && typeof db.prepare === 'function';
  } catch (_) {}

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    node: process.version,
    sqliteOk,
    environment: process.env.VERCEL ? 'vercel' : (config.isDesktop ? 'desktop' : 'server')
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

const handleShutdown = (req, res) => {
  res.json({ ok: 1, message: 'Server is stopping gracefully...' });
  console.log('[Server] Graceful shutdown initiated...');
  setTimeout(() => {
    if (process.platform === 'win32' && process.ppid) {
      try {
        const { exec } = require('child_process');
        exec(`powershell -NoProfile -Command "(Get-Process -Id ${process.ppid} -ErrorAction SilentlyContinue).ProcessName"`, (err, stdout) => {
          const pName = (stdout || '').trim().toLowerCase();
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
  }, 150);
};

app.post('/shutdown', handleShutdown);
app.post('/api/shutdown', handleShutdown);

app.use('/vendor', express.static(path.join(config.frontendDir, 'vendor'), {
  maxAge: '1d'
}));

app.use(authMiddleware);
app.use('/api/auth', authRoutes);

app.use('/api', applicationsRoutes);
app.use('/api', documentsRoutes);
app.use('/api', rolesRoutes);
app.use('/api', settingsRoutes);
app.use('/api', learningsRoutes);
app.use('/api/backup', backupRoutes);

app.use(express.static(config.frontendDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

app.get('/board', (req, res) => res.sendFile(path.join(config.frontendDir, 'board.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(config.frontendDir, 'profile.html')));
app.get('/learnings', (req, res) => res.sendFile(path.join(config.frontendDir, 'learnings.html')));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(config.frontendDir, 'index.html'));
});

app.use(errorHandler);

module.exports = app;
