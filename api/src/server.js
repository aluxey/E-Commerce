import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createApp } from './app.js'
import { createIpRateLimiter } from './middleware/rateLimit.js'
import {
  getEnvPositiveInt,
  normalizeShippingAddress,
  validateAndNormalizeCheckoutPayload,
  validateContactPayload,
} from './lib/validation.js'

const PORT = process.env.PORT || 3000
const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN || '').split(',').map(value => value.trim()).filter(Boolean)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_TO = process.env.EMAIL_TO || 'sabbelshandmade@gmail.com'
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Sabbels Handmade <onboarding@resend.dev>'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const RATE_LIMITS = {
  api: {
    windowMs: getEnvPositiveInt('API_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    max: getEnvPositiveInt('API_RATE_LIMIT_MAX', IS_PRODUCTION ? 300 : 1200),
  },
  checkout: {
    windowMs: getEnvPositiveInt('CHECKOUT_RATE_LIMIT_WINDOW_MS', 10 * 60 * 1000),
    max: getEnvPositiveInt('CHECKOUT_RATE_LIMIT_MAX', IS_PRODUCTION ? 25 : 100),
  },
  contact: {
    windowMs: getEnvPositiveInt('CONTACT_RATE_LIMIT_WINDOW_MS', 10 * 60 * 1000),
    max: getEnvPositiveInt('CONTACT_RATE_LIMIT_MAX', IS_PRODUCTION ? 10 : 50),
  },
  admin: {
    windowMs: getEnvPositiveInt('ADMIN_RATE_LIMIT_WINDOW_MS', 10 * 60 * 1000),
    max: getEnvPositiveInt('ADMIN_RATE_LIMIT_MAX', IS_PRODUCTION ? 10 : 30),
  },
}

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables for API server.')
}

const stripe = new Stripe(STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' })
const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '')
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

if (IS_PRODUCTION && resend && /@resend\.dev>/i.test(RESEND_FROM_EMAIL)) {
  console.warn('RESEND_FROM_EMAIL uses resend.dev in production. Configure a verified domain sender.')
}

const defaultAllowedOrigins = IS_PRODUCTION
  ? ['https://sabbelshandmade.netlify.app']
  : [
      'https://sabbelshandmade.netlify.app',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...CLIENT_ORIGIN])]

const { app, services } = createApp({
  allowedOrigins,
  emailTo: EMAIL_TO,
  isProduction: IS_PRODUCTION,
  rateLimits: RATE_LIMITS,
  resend,
  resendFromEmail: RESEND_FROM_EMAIL,
  stripe,
  stripeWebhookSecret: STRIPE_WEBHOOK_SECRET,
  supabase,
})

let cleanupInterval = null

export function startServer() {
  services.orderService.cleanupAbandonedOrders()

  cleanupInterval = setInterval(() => {
    services.orderService.cleanupAbandonedOrders()
  }, 6 * 60 * 60 * 1000)

  if (typeof cleanupInterval.unref === 'function') cleanupInterval.unref()

  const server = app.listen(PORT, () => {
    console.log(`[api] listening on :${PORT}`)
  })

  return server
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)
if (isMainModule && process.env.NODE_ENV !== 'test') {
  startServer()
}

export const testUtils = {
  createIpRateLimiter,
  getEnvPositiveInt,
  normalizeShippingAddress,
  validateAndNormalizeCheckoutPayload,
  validateContactPayload,
}

export { app, RATE_LIMITS, createApp }
