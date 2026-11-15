const express = require('express');
const app = express();

const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const requestIdMiddleware = require('./middleware/requestId');
const { createRateLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const applicationsRoutes = require('./routes/applications');
const documentsRoutes = require('./routes/documents');
const rolesRoutes = require('./routes/roles');
const settingsRoutes = require('./routes/settings');
const backupRoutes = require('./routes/backup');
const learningsRoutes = require('./routes/learnings');
const dsaRoutes = require('./routes/dsa');
const clipperRoutes = require('./routes/clipper');
const portfolioRoutes = require('./routes/portfolio');
const weeklyChestRoutes = require('./routes/weeklyChest');

app.use(requestIdMiddleware);

// ---------------------------------------------------------------------
// HTTP Security Headers & CORS Configuration
// ---------------------------------------------------------------------
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  const isSecure = Boolean(req.socket?.encrypted) || req.headers?.['x-forwarded-proto'] === 'https' || config.nodeEnv === 'production';
  if (isSecure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

const allowedOrigins = [
  'tauri://localhost',
  'http://tauri.localhost',
  'https://tauri.localhost',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
if (process.env.APP_URL) allowedOrigins.push(process.env.APP_URL.replace(/\/$/, ''));
if (process.env.VERCEL_URL) allowedOrigins.push(`https://${process.env.VERCEL_URL.replace(/\/$/, '')}`);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests without origin header (e.g. desktop native, curl, postman)
    if (!origin) return callback(null, true);

    const isExplicitlyAllowed = allowedOrigins.includes(origin);
    const isVercelApp = /^https:\/\/[a-zA-Z0-9_.-]+\.vercel\.app$/i.test(origin);
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

    if (isExplicitlyAllowed || isVercelApp || isLocalhost) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-storage-mode', 'x-custom-storage-dir']
};

// Universal CORS for Job Clipper endpoints (callable by bookmarklet from any external job board)
app.use('/api/clipper', cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

app.use(cors(corsOptions));
app.use('/api', createRateLimiter({ windowMs: 60 * 1000, max: 500 }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ---------------------------------------------------------------------
// Health & shutdown endpoints
// ---------------------------------------------------------------------
const healthHandler = (req, res) => {
  let sqliteOk = false;
  try {
    const { db } = require('./database/db');
    sqliteOk = !!db && typeof db.prepare === 'function';
  } catch (_) {}

  const isVercel = Boolean(process.env.VERCEL);
  const isTurso = Boolean(config.tursoDatabaseUrl);
  const isEphemeral = Boolean(isVercel && !isTurso);
  const persistenceType = isTurso
    ? 'permanent_turso_cloud'
    : (isVercel ? 'ephemeral_tmp' : (config.isDesktop ? 'permanent_desktop_disk' : 'permanent_local_disk'));

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    node: process.version,
    sqliteOk,
    database: isTurso ? 'turso_cloud' : 'local_sqlite',
    environment: isVercel ? 'vercel' : (config.isDesktop ? 'desktop' : 'server'),
    persistence: {
      isPermanent: !isEphemeral,
      isEphemeral,
      type: persistenceType,
      storageLocation: isTurso ? config.tursoDatabaseUrl : config.dbPath,
      warning: isEphemeral
        ? 'Running in Vercel serverless environment with ephemeral /tmp storage. Data will reset on function recycling. Set TURSO_DATABASE_URL for persistent cloud storage.'
        : null
    }
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.healthHandler = healthHandler;

const { verifyToken } = require('./services/jwtService');

const handleShutdown = (req, res) => {
  // 1. Strictly block remote shutdowns in web/cloud deployment mode
  if (!config.isDesktop) {
    return res.status(403).json({
      ok: 0,
      error: 'Server shutdown endpoint is disabled in web deployment mode.',
      code: 'SHUTDOWN_DISABLED'
    });
  }

  // 2. If an APP_PIN is configured, require authentication via header, body, query, or JWT bearer session
  if (config.appPin) {
    const providedPin = (
      req.headers['x-app-pin'] ||
      req.body?.pin ||
      req.body?.app_pin ||
      req.query?.pin ||
      ''
    ).toString().trim();

    let isAuthorized = false;
    if (providedPin && providedPin === config.appPin) {
      isAuthorized = true;
    } else {
      // Allow authenticated user with valid JWT session
      const authHeader = req.headers['authorization'];
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
      if (token) {
        const decoded = verifyToken(token);
        if (decoded && decoded.id) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(401).json({
        ok: 0,
        error: 'Unauthorized: Valid PIN or authenticated session required to shut down.',
        code: 'UNAUTHORIZED_SHUTDOWN'
      });
    }
  }

  res.json({ ok: 1, message: 'Server is stopping gracefully...' });
  console.log('[Server] Graceful shutdown initiated...');

  // In automated test runs, do not terminate the test process
  if (process.env.NODE_ENV === 'test' || req._testing) {
    return;
  }

  setTimeout(() => {
    if (process.platform === 'win32' && process.ppid) {
      try {
        const { execFile } = require('child_process');
        const ppid = parseInt(process.ppid, 10);
        if (Number.isInteger(ppid) && ppid > 0) {
          // Strictly verify if ppid is a terminal process without running unquoted shell scripts
          execFile('powershell.exe', ['-NoProfile', '-Command', `(Get-Process -Id ${ppid} -ErrorAction SilentlyContinue).ProcessName`], (err, stdout) => {
            const pName = (stdout || '').trim().toLowerCase();
            if (pName === 'cmd' || pName === 'windowsterminal') {
              execFile('taskkill', ['/F', '/PID', String(ppid)], () => {
                process.exit(0);
              });
              setTimeout(() => process.exit(0), 300);
              return;
            }
            process.exit(0);
          });
          setTimeout(() => process.exit(0), 400);
          return;
        }
      } catch (e) {}
    }
    process.exit(0);
  }, 150);
};

app.post('/shutdown', handleShutdown);
app.post('/api/shutdown', handleShutdown);
app.handleShutdown = handleShutdown;

// ---------------------------------------------------------------------
// Static assets & Front‑end handling
// ---------------------------------------------------------------------
app.use('/vendor', express.static(path.join(config.frontendDir, 'vendor'), {
  maxAge: '1d'
}));

app.use(express.static(config.frontendDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// ---------------------------------------------------------------------
// API routes (protected)
// ---------------------------------------------------------------------
app.use('/api', authMiddleware);
app.use('/api/auth', authRoutes);

app.use('/api', applicationsRoutes);
app.use('/api', documentsRoutes);
app.use('/api', rolesRoutes);
app.use('/api', settingsRoutes);
app.use('/api', learningsRoutes);
app.use('/api', dsaRoutes);
app.use('/api', clipperRoutes);
app.use('/api/clipper', clipperRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api', weeklyChestRoutes);
app.use('/api/backup', backupRoutes);

// Background Schedulers (Evening Streak Safeguard Reminders)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  try {
    const { startStreakScheduler } = require('./services/streakReminderService');
    startStreakScheduler();
  } catch (err) {
    console.warn('[Streak Scheduler Init Warning]:', err.message);
  }
}

// Catch-all for API 404 and SPA fallback
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      ok: 0,
      error: 'Endpoint not found',
      code: 'NOT_FOUND',
      ...(req.id ? { requestId: req.id } : {})
    });
  }
  const indexPath = path.join(config.frontendDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Job Tracker API</title></head>
    <body style="font-family: sans-serif; padding: 2rem; background: #09090b; color: #f4f4f5;">
      <h2>🚀 Job Tracker Backend Server Active</h2>
      <p>API endpoints are live at <code>http://localhost:${config.port}/api</code></p>
      <p>To view the React frontend UI, run <code>npm run dev</code> from <code>board_website/frontend</code> or build with <code>npm run build</code>.</p>
    </body>
    </html>
  `);
});

app.use(errorHandler);

module.exports = app;
