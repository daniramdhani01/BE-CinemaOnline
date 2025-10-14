const logger = (req, res, next) => {
  const start = process.hrtime.bigint();
  const { method, originalUrl } = req;

  const logRequest = (tag) => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    const statusCode = res.statusCode;
    console.log(
      `[${new Date().toISOString()}] ${tag} ${method} ${originalUrl} ${statusCode} ${durationMs.toFixed(2)}ms`
    );
  };

  res.on('finish', () => logRequest('OK'));
  res.on('close', () => {
    if (!res.writableEnded) {
      logRequest('ABORT');
    }
  });

  next();
};

const errorLogger = (err, req, res, next) => {
  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
  console.error(
    `[${new Date().toISOString()}] ERROR ${req.method} ${req.originalUrl} ${statusCode} - ${err.message}`
  );
  if (err.stack) {
    console.error(err.stack);
  }
  next(err);
};

const logApiError = (req, err, context) => {
  const timestamp = new Date().toISOString();
  const label = context ? `API-${context}` : 'API';
  const method = req?.method ?? '-';
  const originalUrl = req?.originalUrl ?? '-';
  const message =
    typeof err === 'string' ? err : err?.message ?? 'Unknown error';

  console.error(
    `[${timestamp}] ${label} ERROR ${method} ${originalUrl} - ${message}`
  );

  if (err && err.stack) {
    console.error(err.stack);
  }
};

const withErrorLogging = (handler, context) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (err) {
    logApiError(req, err, context);
    if (res.headersSent) {
      return next(err);
    }
    const message =
      typeof err === 'string' ? err : err?.message || 'server error';
    res.status(400);
    res.send({
      status: 'failed',
      message,
    });
  }
};

const logSystem = (scope, message) => {
  const timestamp = new Date().toISOString();
  const tag = scope ? `SYS-${scope}` : 'SYS';
  console.log(`[${timestamp}] ${tag} ${message}`);
};

const logSystemError = (scope, err) => {
  const timestamp = new Date().toISOString();
  const tag = scope ? `SYS-${scope}` : 'SYS';
  const message = typeof err === 'string' ? err : err?.message ?? 'Unknown error';
  console.error(`[${timestamp}] ${tag} ERROR ${message}`);
  if (err && err.stack) {
    console.error(err.stack);
  }
};

module.exports = {
  logger,
  errorLogger,
  logApiError,
  withErrorLogging,
  logSystem,
  logSystemError,
};
