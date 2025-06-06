class AppError extends Error {
  constructor(message, status = 500, cause) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    if (cause) this.cause = cause;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };
