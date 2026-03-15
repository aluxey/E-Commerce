export function sendError(res, status, code, message, details) {
  return res.status(status).json({
    error: message,
    code,
    ...(details ? { details } : {}),
  })
}
