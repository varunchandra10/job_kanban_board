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

const app = express();

app.use(cors());
app.use('/api', createRateLimiter({ windowMs: 60 * 1000, max: 500 }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

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

app.use('/vendor', express.static(path.join(config.rootDir, 'vendor'), {
  maxAge: '1d'
}));

app.use('/api/auth', authRoutes);
app.use(authMiddleware);

app.use('/api', applicationsRoutes);
app.use('/api', documentsRoutes);
app.use('/api', rolesRoutes);
app.use('/api', settingsRoutes);
app.use('/api/backup', backupRoutes);

app.use(express.static(config.rootDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(config.rootDir, 'index.html'));
});

app.use(errorHandler);

module.exports = app;
