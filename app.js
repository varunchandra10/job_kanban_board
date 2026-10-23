const express = require('express');
const app = require('./backend/src/app');

// When executed directly (e.g. node server.js or npm start)
if (require.main === module) {
  require('./backend/server');
}

module.exports = app;
