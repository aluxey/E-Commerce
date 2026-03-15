import { Router } from 'express'
import { sendError } from '../lib/http.js'
import { validateContactPayload } from '../lib/validation.js'

export function createContactRouter({ contactLimiter, emailService, uploadContactAttachment }) {
  const router = Router()

  router.post('/contact', contactLimiter, uploadContactAttachment, async (req, res) => {
    try {
      const validation = validateContactPayload(req.body)
      if (!validation.ok) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid contact payload', validation.details)
      }

      const payload = await emailService.sendContactEmail({
        ...validation.value,
        attachment: req.file,
      })

      return res.status(200).json(payload)
    } catch (error) {
      console.error('Contact form error:', error)
      return sendError(res, 500, 'CONTACT_SEND_FAILED', 'Erreur lors de l\'envoi du message')
    }
  })

  return router
}
