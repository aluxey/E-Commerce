import express from 'express'
import cors from 'cors'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import multer from 'multer'
import { fileURLToPath } from 'url'

const PORT = process.env.PORT || 3000
const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Email configuration - using Resend
const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_TO = 'sabbelshandmade@gmail.com'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const MAX_CART_ITEMS = 100
const MAX_ITEM_QUANTITY = 50
const ALLOWED_CURRENCIES = new Set(['eur'])
const ALLOWED_CONTACT_SUBJECTS = new Set(['custom-order', 'question', 'order-issue', 'collaboration', 'other'])
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED_ATTACHMENT_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

function getEnvPositiveInt(name, fallback) {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    console.warn(`[api] Invalid ${name}="${raw}", using fallback ${fallback}`)
    return fallback
  }
  return parsed
}

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

// Configure Resend for emails
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

// Configure multer for file uploads (max 10MB)
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

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)

// Basic security headers without extra dependencies
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site')
  if (IS_PRODUCTION) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
})

function sendError(res, status, code, message, details) {
  return res.status(status).json({
    error: message,
    code,
    ...(details ? { details } : {}),
  })
}

// Webhook needs the raw body
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message)
    return sendError(res, 400, 'INVALID_WEBHOOK_SIGNATURE', `Webhook Error: ${err.message}`)
  }

  console.log(`[Webhook] Received event: ${event.type}`)

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object
        const orderId = pi.metadata?.order_id
        console.log(`[Webhook] Payment succeeded for order: ${orderId}`)
        
        if (orderId) {
          // Update order status to paid
          const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'paid' })
            .eq('id', orderId)
          
          if (updateError) {
            console.error(`[Webhook] Failed to update order ${orderId}:`, updateError)
          } else {
            console.log(`[Webhook] Order ${orderId} marked as paid`)
            
            // Send order recap email to shop owner
            try {
              await sendOrderRecapEmail(orderId)
              console.log(`[Webhook] Email sent for order ${orderId}`)
            } catch (emailErr) {
              console.error(`[Webhook] Failed to send email for order ${orderId}:`, emailErr)
            }
          }
        }
        break
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object
        const orderId = pi.metadata?.order_id
        console.log(`[Webhook] Payment failed for order: ${orderId}`)
        
        if (orderId) {
          await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
        }
        break
      }
      case 'payment_intent.canceled': {
        const pi = event.data.object
        const orderId = pi.metadata?.order_id
        console.log(`[Webhook] Payment canceled for order: ${orderId}`)
        
        if (orderId) {
          await supabase.from('orders').update({ status: 'canceled' }).eq('id', orderId)
        }
        break
      }
      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
        break
    }
  } catch (err) {
    console.error('Webhook handling error:', err)
    return sendError(res, 500, 'WEBHOOK_INTERNAL_ERROR', 'Internal webhook error')
  }

  res.json({ received: true })
})

function createIpRateLimiter({ windowMs, max, message }) {
  const bucket = new Map()

  // Cleanup stale entries periodically
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of bucket.entries()) {
      if (entry.resetAt <= now) bucket.delete(ip)
    }
  }, Math.max(30_000, Math.floor(windowMs / 2)))
  if (typeof timer.unref === 'function') timer.unref()

  return (req, res, next) => {
    const forwarded = req.headers['x-forwarded-for']
    const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded
    const ip = (forwardedIp || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown'
    const now = Date.now()
    const current = bucket.get(ip)

    if (!current || current.resetAt <= now) {
      bucket.set(ip, { count: 1, resetAt: now + windowMs })
      res.setHeader('RateLimit-Limit', String(max))
      res.setHeader('RateLimit-Remaining', String(Math.max(0, max - 1)))
      res.setHeader('RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)))
      return next()
    }

    current.count += 1
    const remaining = Math.max(0, max - current.count)
    res.setHeader('RateLimit-Limit', String(max))
    res.setHeader('RateLimit-Remaining', String(remaining))
    res.setHeader('RateLimit-Reset', String(Math.ceil(current.resetAt / 1000)))

    if (current.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
      res.setHeader('Retry-After', String(retryAfterSeconds))
      return sendError(res, 429, 'RATE_LIMITED', message || 'Too many requests', { retryAfterSeconds })
    }

    return next()
  }
}

// CORS - allow Netlify and localhost
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

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl/monitoring/backends)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(null, false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  })
)

const apiLimiter = createIpRateLimiter({
  windowMs: RATE_LIMITS.api.windowMs,
  max: RATE_LIMITS.api.max,
  message: 'Too many API requests',
})
const checkoutLimiter = createIpRateLimiter({
  windowMs: RATE_LIMITS.checkout.windowMs,
  max: RATE_LIMITS.checkout.max,
  message: 'Too many checkout attempts',
})
const contactLimiter = createIpRateLimiter({
  windowMs: RATE_LIMITS.contact.windowMs,
  max: RATE_LIMITS.contact.max,
  message: 'Too many contact attempts',
})
const adminLimiter = createIpRateLimiter({
  windowMs: RATE_LIMITS.admin.windowMs,
  max: RATE_LIMITS.admin.max,
  message: 'Too many admin requests',
})

app.use('/api', apiLimiter)

// JSON parser for other routes
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// Helpers
async function getUserFromAuthHeader(authHeader) {
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.slice('Bearer '.length).trim()
  if (!token || token.split('.').length !== 3) return null
  const { data, error } = await supabase.auth.getUser(token)
  if (error) return null
  return data.user
}

async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, role, email')
    .eq('id', userId)
    .single()

  if (error) return null
  return data
}

async function requireAdmin(req, res, next) {
  try {
    const user = await getUserFromAuthHeader(req.headers.authorization)
    if (!user) return sendError(res, 401, 'UNAUTHORIZED', 'Unauthorized')

    const profile = await getUserProfile(user.id)
    if (!profile || profile.role !== 'admin') {
      return sendError(res, 403, 'FORBIDDEN', 'Forbidden: admin access required')
    }

    req.authUser = user
    req.authProfile = profile
    return next()
  } catch (error) {
    console.error('Admin auth error:', error)
    return sendError(res, 500, 'AUTHORIZATION_ERROR', 'Authorization check failed')
  }
}

function parsePositiveInt(value) {
  const num = Number(value)
  return Number.isInteger(num) && num > 0 ? num : null
}

function normalizeCustomization(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input
}

function validateAndNormalizeCheckoutPayload(body) {
  const details = []
  const currencyRaw = typeof body?.currency === 'string' ? body.currency.trim().toLowerCase() : ''
  const currency = currencyRaw || 'eur'
  if (!ALLOWED_CURRENCIES.has(currency)) {
    details.push({
      field: 'currency',
      issue: `Unsupported currency. Allowed: ${[...ALLOWED_CURRENCIES].join(', ')}`,
    })
  }

  if (!Array.isArray(body?.cartItems)) {
    details.push({ field: 'cartItems', issue: 'cartItems must be an array' })
    return { ok: false, details }
  }

  if (body.cartItems.length === 0) {
    details.push({ field: 'cartItems', issue: 'cartItems cannot be empty' })
  }
  if (body.cartItems.length > MAX_CART_ITEMS) {
    details.push({ field: 'cartItems', issue: `cartItems cannot exceed ${MAX_CART_ITEMS} items` })
  }

  const normalizedItems = []
  body.cartItems.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      details.push({ field: `cartItems[${index}]`, issue: 'Item must be an object' })
      return
    }

    const itemId = parsePositiveInt(item.item_id ?? item.id ?? item.itemId)
    const variantId = parsePositiveInt(item.variant_id ?? item.variantId)
    const quantity = parsePositiveInt(item.quantity)
    const customization = normalizeCustomization(item.customization)

    if (!itemId) details.push({ field: `cartItems[${index}].item_id`, issue: 'Must be a positive integer' })
    if (!variantId) details.push({ field: `cartItems[${index}].variant_id`, issue: 'Must be a positive integer' })
    if (!quantity) details.push({ field: `cartItems[${index}].quantity`, issue: 'Must be a positive integer' })
    if (quantity && quantity > MAX_ITEM_QUANTITY) {
      details.push({
        field: `cartItems[${index}].quantity`,
        issue: `Cannot exceed ${MAX_ITEM_QUANTITY}`,
      })
    }

    if (itemId && variantId && quantity && quantity <= MAX_ITEM_QUANTITY) {
      normalizedItems.push({
        item_id: itemId,
        variant_id: variantId,
        quantity,
        customization,
      })
    }
  })

  if (details.length) return { ok: false, details }
  return {
    ok: true,
    value: {
      currency,
      cartItems: normalizedItems,
    },
  }
}

function validateContactPayload(body) {
  const details = []
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const subject = typeof body?.subject === 'string' ? body.subject.trim() : ''
  const message = typeof body?.message === 'string' ? body.message.trim() : ''

  if (name.length < 2 || name.length > 120) {
    details.push({ field: 'name', issue: 'Name must be between 2 and 120 characters' })
  }
  if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
    details.push({ field: 'email', issue: 'Invalid email format' })
  }
  if (!ALLOWED_CONTACT_SUBJECTS.has(subject)) {
    details.push({ field: 'subject', issue: 'Invalid subject value' })
  }
  if (message.length < 5 || message.length > 5000) {
    details.push({ field: 'message', issue: 'Message must be between 5 and 5000 characters' })
  }

  if (details.length) return { ok: false, details }
  return { ok: true, value: { name, email, subject, message } }
}

function uploadContactAttachment(req, res, next) {
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

    console.error('Upload middleware error:', err)
    return sendError(res, 500, 'UPLOAD_ERROR', 'Attachment upload failed')
  })
}

async function gatherCartPricing(cartItems) {
  if (!cartItems.length) {
    return { totalCents: 0, itemsById: new Map(), variantsById: new Map() }
  }

  const itemIds = [...new Set(cartItems.map(i => i.item_id))]
  const variantIds = [...new Set(cartItems.map(i => i.variant_id).filter(Boolean))]

  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('id, price')
    .in('id', itemIds)
  if (itemsError) throw itemsError
  const itemMap = new Map(items.map(i => [i.id, Number(i.price)]))

  let variantMap = new Map()
  if (variantIds.length) {
    const { data: variants, error: variantsError } = await supabase
      .from('item_variants')
      .select('id, item_id, price, stock')
      .in('id', variantIds)
    if (variantsError) throw variantsError
    variantMap = new Map(
      variants.map(v => [v.id, { item_id: v.item_id, price: Number(v.price), stock: v.stock ?? 0 }])
    )
  }

  const total = cartItems.reduce((sum, it) => {
    const basePrice = itemMap.get(it.item_id) || 0
    const variant = it.variant_id ? variantMap.get(it.variant_id) : null
    const price = variant ? variant.price : basePrice
    return sum + price * it.quantity
  }, 0)

  return {
    totalCents: Math.max(0, Math.round(total * 100)),
    itemsById: itemMap,
    variantsById: variantMap,
  }
}

app.post('/api/checkout', checkoutLimiter, async (req, res) => {
  try {
    const user = await getUserFromAuthHeader(req.headers.authorization)
    if (!user) return sendError(res, 401, 'UNAUTHORIZED', 'Unauthorized')

    const validation = validateAndNormalizeCheckoutPayload(req.body)
    if (!validation.ok) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid checkout payload', validation.details)
    }
    const { currency, cartItems } = validation.value

    const { totalCents: amount, variantsById } = await gatherCartPricing(cartItems)
    if (amount <= 0) return sendError(res, 400, 'INVALID_AMOUNT', 'Invalid amount')

    for (const item of cartItems) {
      const variant = variantsById.get(item.variant_id)
      if (!variant) {
        return sendError(res, 400, 'INVALID_VARIANT', `Variant ${item.variant_id} introuvable`)
      }
      if (variant.item_id !== item.item_id) {
        return sendError(res, 400, 'ITEM_VARIANT_MISMATCH', 'Variant et produit incompatibles')
      }
      if (variant.stock != null && variant.stock < item.quantity) {
        return sendError(res, 400, 'INSUFFICIENT_STOCK', 'Stock insuffisant pour un des variants')
      }
    }

    // Create order in pending
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({ user_id: user.id, status: 'pending', total: amount / 100 })
      .select('id')
      .single()
    if (orderErr) throw orderErr

    // Insert order items
    const orderItemsPayload = cartItems.map(ci => ({
      order_id: order.id,
      item_id: ci.item_id,
      quantity: ci.quantity,
      variant_id: ci.variant_id,
      unit_price: variantsById.get(ci.variant_id)?.price ?? 0,
      customization: ci.customization || {},
    }))
    const { error: oiErr } = await supabase.from('order_items').insert(orderItemsPayload)
    if (oiErr) throw oiErr

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        user_id: user.id,
        order_id: order.id,
      },
    })

    // Enregistrer l'identifiant du paiement sur la commande
    try {
      await supabase
        .from('orders')
        .update({ payment_intent_id: paymentIntent.id })
        .eq('id', order.id)
    } catch (_) {
      // no-op: ne bloque pas le checkout si l'update échoue
    }

    return res.status(200).json({ clientSecret: paymentIntent.client_secret, orderId: order.id })
  } catch (err) {
    console.error('Checkout error:', err)
    return sendError(res, 500, 'CHECKOUT_FAILED', 'Checkout failed')
  }
})

// ============ EMAIL FUNCTIONS ============

/**
 * Send order recap email to shop owner
 */
async function sendOrderRecapEmail(orderId) {
  try {
    // Fetch order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()
    
    if (orderError || !order) {
      console.error('Failed to fetch order for email:', orderError)
      return
    }

    // Fetch order items with product and variant details
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        items:item_id (name),
        variants:variant_id (size, color_id, colors:color_id (name))
      `)
      .eq('order_id', orderId)

    if (itemsError) {
      console.error('Failed to fetch order items for email:', itemsError)
    }

    // Fetch customer info
    const { data: customer } = await supabase
      .from('users')
      .select('email, full_name, username')
      .eq('id', order.user_id)
      .single()

    const customerEmail = customer?.email || 'Non renseigné'
    const customerName = customer?.full_name || customer?.username || 'Client'

    // Build items HTML
    const itemsHtml = (orderItems || []).map(item => {
      const productName = item.items?.name || `Produit #${item.item_id}`
      const size = item.variants?.size || '-'
      const color = item.variants?.colors?.name || '-'
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${productName}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${size}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${color}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${(item.unit_price * item.quantity).toFixed(2)} €</td>
        </tr>
      `
    }).join('')

    const orderDate = new Date(order.created_at).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B7355 0%, #A0522D 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px; }
          .order-info { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .order-info p { margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: 600; }
          .total { font-size: 1.2em; font-weight: bold; text-align: right; padding: 20px 0; border-top: 2px solid #8B7355; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Nouvelle Commande!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Sabbels Handmade</p>
          </div>
          <div class="content">
            <h2>Commande #${orderId}</h2>
            <p>Une nouvelle commande vient d'être passée et payée.</p>
            
            <div class="order-info">
              <p><strong>Date:</strong> ${orderDate}</p>
              <p><strong>Client:</strong> ${customerName}</p>
              <p><strong>Email:</strong> ${customerEmail}</p>
              <p><strong>Statut:</strong> <span style="color: #22c55e; font-weight: bold;">Payée ✓</span></p>
            </div>

            <h3>Articles commandés</h3>
            <table>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Taille</th>
                  <th>Couleur</th>
                  <th style="text-align: center;">Qté</th>
                  <th style="text-align: right;">Prix</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="total">
              Total: ${order.total?.toFixed(2) || '0.00'} €
            </div>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement par votre boutique Sabbels Handmade.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email using Resend
    if (resend) {
      await resend.emails.send({
        from: 'Sabbels Handmade <onboarding@resend.dev>',
        to: EMAIL_TO,
        subject: `🧶 Nouvelle commande #${orderId} - ${order.total?.toFixed(2) || '0.00'} €`,
        html: emailHtml,
      })
      console.log(`Order recap email sent for order #${orderId}`)
    } else {
      console.log('RESEND_API_KEY not configured, skipping order email')
    }
  } catch (err) {
    console.error('Failed to send order recap email:', err)
  }
}

/**
 * Contact form endpoint
 */
app.post('/api/contact', contactLimiter, uploadContactAttachment, async (req, res) => {
  try {
    const validation = validateContactPayload(req.body)
    if (!validation.ok) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid contact payload', validation.details)
    }
    const { name, email, subject, message } = validation.value
    const attachment = req.file

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B7355 0%, #A0522D 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px; }
          .info-block { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .info-block p { margin: 8px 0; }
          .message-block { background: #fff; border-left: 4px solid #8B7355; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
          .attachment-notice { background: #e3f2fd; padding: 10px 15px; border-radius: 4px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Nouveau Message</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Formulaire de Contact</p>
          </div>
          <div class="content">
            <div class="info-block">
              <p><strong>De:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>Sujet:</strong> ${subject}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('de-DE', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>

            <h3>Message</h3>
            <div class="message-block">
              ${message.replace(/\n/g, '<br>')}
            </div>

            ${attachment ? `
              <div class="attachment-notice">
                📎 <strong>Pièce jointe:</strong> ${attachment.originalname} (${(attachment.size / 1024).toFixed(1)} KB)
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>Pour répondre, utilisez directement l'adresse email du client ci-dessus.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: 'Sabbels Handmade Contact <onboarding@resend.dev>',
      to: EMAIL_TO,
      replyTo: email,
      subject: `📬 ${subject} - de ${name}`,
      html: emailHtml,
    }

    // Add attachment if present (Resend supports attachments)
    if (attachment) {
      mailOptions.attachments = [{
        filename: attachment.originalname,
        content: attachment.buffer,
      }]
    }

    if (resend) {
      await resend.emails.send(mailOptions)
      console.log(`Contact email sent from ${email}`)
      return res.status(200).json({ success: true, message: 'Message envoyé avec succès' })
    } else {
      console.log('RESEND_API_KEY not configured, contact form submission logged only')
      console.log({ name, email, subject, message, hasAttachment: !!attachment })
      return res.status(200).json({ success: true, message: 'Message reçu (mode test)' })
    }
  } catch (err) {
    console.error('Contact form error:', err)
    return sendError(res, 500, 'CONTACT_SEND_FAILED', 'Erreur lors de l\'envoi du message')
  }
})

// ============ CLEANUP ABANDONED ORDERS ============

/**
 * Clean up abandoned orders (pending for more than 24 hours)
 * This removes incomplete checkout attempts
 */
async function cleanupAbandonedOrders() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    // First, get the orders to delete so we can also delete their items
    const { data: abandonedOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'pending')
      .lt('created_at', twentyFourHoursAgo)
    
    if (fetchError) {
      console.error('[Cleanup] Error fetching abandoned orders:', fetchError)
      return { deleted: 0, error: fetchError }
    }
    
    if (!abandonedOrders || abandonedOrders.length === 0) {
      console.log('[Cleanup] No abandoned orders to clean up')
      return { deleted: 0, error: null }
    }
    
    const orderIds = abandonedOrders.map(o => o.id)
    
    // Delete order items first (foreign key constraint)
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .in('order_id', orderIds)
    
    if (itemsError) {
      console.error('[Cleanup] Error deleting order items:', itemsError)
    }
    
    // Delete the orders
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .in('id', orderIds)
    
    if (ordersError) {
      console.error('[Cleanup] Error deleting orders:', ordersError)
      return { deleted: 0, error: ordersError }
    }
    
    console.log(`[Cleanup] Successfully deleted ${orderIds.length} abandoned orders`)
    return { deleted: orderIds.length, error: null }
  } catch (err) {
    console.error('[Cleanup] Unexpected error:', err)
    return { deleted: 0, error: err }
  }
}

let cleanupInterval = null

export function startServer() {
  // Run cleanup on server start
  cleanupAbandonedOrders()

  // Run cleanup every 6 hours
  cleanupInterval = setInterval(cleanupAbandonedOrders, 6 * 60 * 60 * 1000)
  if (typeof cleanupInterval.unref === 'function') cleanupInterval.unref()

  const server = app.listen(PORT, () => {
    console.log(`[api] listening on :${PORT}`)
  })
  return server
}

// Manual cleanup endpoint (admin only - for testing)
app.post('/api/admin/cleanup-orders', adminLimiter, requireAdmin, async (req, res) => {
  try {
    const result = await cleanupAbandonedOrders()
    res.json({ success: true, ...result })
  } catch (err) {
    return sendError(res, 500, 'CLEANUP_FAILED', 'Cleanup failed')
  }
})

// Last-resort API error handler
app.use((err, _req, res, _next) => {
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
})

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)
if (isMainModule && process.env.NODE_ENV !== 'test') {
  startServer()
}

export const testUtils = {
  createIpRateLimiter,
  validateAndNormalizeCheckoutPayload,
  validateContactPayload,
  getEnvPositiveInt,
}

export { app, RATE_LIMITS }
