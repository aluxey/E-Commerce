import multer from 'multer'
import { sendError } from '../lib/http.js'

const ALLOWED_ATTACHMENT_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export function createContactUploadMiddleware() {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const isAllowedImage = typeof file.mimetype === 'string' && file.mimetype.startsWith('image/')
      if (isAllowedImage || ALLOWED_ATTACHMENT_MIME.has(file.mimetype)) {
        return cb(null, true)
      }

      const error = new Error('Unsupported file type. Allowed: images, PDF, DOC, DOCX.')
      error.code = 'UNSUPPORTED_FILE_TYPE'
      return cb(error)
    },
  })

  return function uploadContactAttachment(req, res, next) {
    upload.single('attachment')(req, res, err => {
      if (!err) return next()

      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 413, 'FILE_TOO_LARGE', 'Attachment is too large (max 10MB)')
        }
        return sendError(res, 400, 'UPLOAD_ERROR', err.message)
      }

      if (err?.code === 'UNSUPPORTED_FILE_TYPE') {
        return sendError(res, 400, 'UNSUPPORTED_FILE_TYPE', err.message)
      }

      return sendError(res, 500, 'UPLOAD_ERROR', 'Attachment upload failed')
    })
  }
}
