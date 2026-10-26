const app = require('./src/app');
const config = require('./src/config');

let server;

if (!process.env.VERCEL) {
  server = app.listen(config.port, () => {
    console.log('=======================================================');
    console.log(`🚀 Job Tracker Modern Server running on port ${config.port}`);
    console.log(`📍 Local URL:     http://localhost:${config.port}`);
    console.log(`💾 Database:      ${config.dbPath}`);
    console.log(`📁 Upload Dir:    ${config.uploadDir}`);
    console.log(`🔒 Security PIN:  ${config.appPin ? 'Enabled' : 'Disabled (Local Access)'}`);
    console.log('📦 Architecture:  Modular Express + Streaming Multer + SQLite WAL');
    console.log('=======================================================');
  });

  process.on('SIGINT', () => {
    console.log('\n[Server] SIGINT received. Shutting down gracefully...');
    server.close(() => {
      console.log('[Server] Closed successfully.');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('\n[Server] SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('[Server] Closed successfully.');
      process.exit(0);
    });
  });
}

module.exports = app;

