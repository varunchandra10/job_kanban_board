/**
 * Standardized API Error Response Schema Middleware
 * Returns consistent error envelopes:
 * {
 *   "ok": 0,
 *   "error": "Descriptive error message",
 *   "code": "ERROR_CODE_IDENTIFIER",
 *   "requestId": "uuid"
 * }
 */

function getErrorCode(status, err) {
  if (err.code && typeof err.code === 'string' && /^[A-Z0-9_]+$/.test(err.code)) {
    return err.code;
  }
  if (err.name === 'MulterError') {
    return 'FILE_UPLOAD_ERROR';
  }
  switch (status) {
    case 400: return 'BAD_REQUEST';
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 409: return 'CONFLICT';
    case 422: return 'UNPROCESSABLE_ENTITY';
    case 429: return 'RATE_LIMITED';
    default: return 'INTERNAL_SERVER_ERROR';
  }
}

function errorHandler(err, req, res, next) {
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status <= 599
    ? err.status
    : (err.name === 'MulterError' ? 400 : 500);

  const code = getErrorCode(status, err);
  const requestId = req?.id || (res && typeof res.getHeader === 'function' ? res.getHeader('X-Request-Id') : undefined) || undefined;

  if (status >= 500) {
    console.error(`[Server Error${requestId ? ` | req:${requestId}` : ''}]`, err);
  } else {
    console.warn(`[Client Error ${status}${requestId ? ` | req:${requestId}` : ''}]:`, err.message || err);
  }

  const responsePayload = {
    ok: 0,
    error: err.message || 'Internal Server Error',
    code,
    ...(requestId ? { requestId } : {})
  };

  res.status(status).json(responsePayload);
}

module.exports = errorHandler;
