import multer from 'multer'
import { sendError } from '../lib/http.js'

export function apiErrorHandler(err, _req, res, _next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 413, 'FILE_TOO_LARGE', 'Attachment is too large (max 10MB)')
    }
    return sendError(res, 400, 'UPLOAD_ERROR', err.message)
  }

  if (err?.type === 'entity.too.large') {
    return sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'Request payload too large')
  }

  if (err instanceof SyntaxError && err?.status === 400 && 'body' in err) {
    return sendError(res, 400, 'INVALID_JSON', 'Invalid JSON payload')
  }

  console.error('Unhandled API error:', err)
  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error')
}
