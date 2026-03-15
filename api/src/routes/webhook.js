import { Router, raw } from 'express'
import { sendError } from '../lib/http.js'

export function createWebhookRouter({ orderService, paymentService, stripe, stripeWebhookSecret }) {
  const router = Router()

  router.post('/stripe/webhook', raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature']
    let event

    try {
      event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret)
    } catch (error) {
      console.error('Webhook signature verification failed.', error.message)
      return sendError(res, 400, 'INVALID_WEBHOOK_SIGNATURE', `Webhook Error: ${error.message}`)
    }

    let hasEventLock = false
    try {
      const lock = await paymentService.acquireStripeEventLock(event.id)
      if (!lock.acquired) {
        return res.json({ received: true, duplicate: true })
      }
      hasEventLock = true
      await orderService.handleWebhookEvent(event)
      return res.json({ received: true })
    } catch (error) {
      console.error('Webhook handling error:', error)
      if (hasEventLock) {
        await paymentService.releaseStripeEventLock(event.id)
      }
      return sendError(res, 500, 'WEBHOOK_INTERNAL_ERROR', 'Internal webhook error')
    }
  })

  return router
}
