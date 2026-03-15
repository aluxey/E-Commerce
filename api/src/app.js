import express from 'express'
import { apiErrorHandler } from './middleware/errorHandler.js'
import { createIpRateLimiter } from './middleware/rateLimit.js'
import { applySecurityMiddleware } from './middleware/security.js'
import { createContactUploadMiddleware } from './middleware/upload.js'
import { createAdminRouter } from './routes/admin.js'
import { createCheckoutRouter } from './routes/checkout.js'
import { createContactRouter } from './routes/contact.js'
import { createHealthRouter } from './routes/health.js'
import { createWebhookRouter } from './routes/webhook.js'
import { createAuthService } from './services/auth.js'
import { createEmailService } from './services/email.js'
import { createOrderService } from './services/orders.js'
import { createPaymentService } from './services/payments.js'

export function createApp(config) {
  const app = express()

  applySecurityMiddleware(app, {
    allowedOrigins: config.allowedOrigins,
    isProduction: config.isProduction,
  })

  const authService = createAuthService({ supabase: config.supabase })
  const paymentService = createPaymentService({ supabase: config.supabase })
  const emailService = createEmailService({
    supabase: config.supabase,
    resend: config.resend,
    emailTo: config.emailTo,
    fromEmail: config.resendFromEmail,
  })
  const orderService = createOrderService({
    supabase: config.supabase,
    stripe: config.stripe,
    paymentService,
    emailService,
  })

  const apiLimiter = createIpRateLimiter({
    windowMs: config.rateLimits.api.windowMs,
    max: config.rateLimits.api.max,
    message: 'Too many API requests',
  })
  const checkoutLimiter = createIpRateLimiter({
    windowMs: config.rateLimits.checkout.windowMs,
    max: config.rateLimits.checkout.max,
    message: 'Too many checkout attempts',
  })
  const contactLimiter = createIpRateLimiter({
    windowMs: config.rateLimits.contact.windowMs,
    max: config.rateLimits.contact.max,
    message: 'Too many contact attempts',
  })
  const adminLimiter = createIpRateLimiter({
    windowMs: config.rateLimits.admin.windowMs,
    max: config.rateLimits.admin.max,
    message: 'Too many admin requests',
  })

  const uploadContactAttachment = createContactUploadMiddleware()

  app.use('/api', createWebhookRouter({
    orderService,
    paymentService,
    stripe: config.stripe,
    stripeWebhookSecret: config.stripeWebhookSecret,
  }))
  app.use('/api', apiLimiter)
  app.use(express.json({ limit: '1mb' }))
  app.use('/api', createHealthRouter())
  app.use('/api', createCheckoutRouter({ authService, checkoutLimiter, orderService }))
  app.use('/api', createContactRouter({ contactLimiter, emailService, uploadContactAttachment }))
  app.use('/api', createAdminRouter({ adminLimiter, authService, orderService }))
  app.use(apiErrorHandler)

  return {
    app,
    services: {
      authService,
      emailService,
      orderService,
      paymentService,
    },
    middlewares: {
      adminLimiter,
      apiLimiter,
      checkoutLimiter,
      contactLimiter,
      uploadContactAttachment,
    },
  }
}
