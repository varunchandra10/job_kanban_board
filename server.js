const express = require('express');
const app = require('./web_app/backend/src/app');

// When executed directly (e.g. node server.js or npm start)
if (require.main === module) {
  require('./web_app/backend/server');
}

module.exports = app;
