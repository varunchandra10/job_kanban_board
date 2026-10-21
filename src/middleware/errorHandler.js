function errorHandler(err, req, res, next) {
  console.error('[Server Error]', err);
  const status = err.status || (err.name === 'MulterError' ? 400 : 500);
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
