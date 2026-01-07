import express from 'express'
import cors from 'cors'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import multer from 'multer'

const PORT = process.env.PORT || 3000
const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Email configuration - using Resend
const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_TO = 'sabbelshandmade@gmail.com'

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
})

const app = express()

// Webhook needs the raw body
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
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
    return res.status(500).json({ error: 'Internal webhook error' })
  }

  res.json({ received: true })
})

// JSON parser for other routes
app.use(express.json())

// CORS - allow Netlify and localhost
const allowedOrigins = [
  'https://sabbelshandmade.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000',
  ...CLIENT_ORIGIN
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      // In development, allow all
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true)
      }
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  })
)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// Helpers
async function getUserFromAuthHeader(authHeader) {
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data, error } = await supabase.auth.getUser(token)
  if (error) return null
  return data.user
}

function normalizeCartItems(rawItems) {
  if (!Array.isArray(rawItems)) return []
  return rawItems
    .map(i => ({
      item_id: i.item_id || i.id || i.itemId,
      quantity: Math.max(1, Number(i.quantity) || 1),
      variant_id: i.variant_id != null ? Number(i.variant_id) : i.variantId != null ? Number(i.variantId) : null,
      customization: i.customization || {},
    }))
    .filter(i => i.item_id)
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

app.post('/api/checkout', async (req, res) => {
  try {
    const user = await getUserFromAuthHeader(req.headers.authorization)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const currency = (req.body.currency || 'eur').toLowerCase()
    const cartItems = normalizeCartItems(req.body.cartItems)
    if (!cartItems.length) return res.status(400).json({ error: 'Cart is empty' })

    if (cartItems.some(ci => !ci.variant_id)) {
      return res.status(400).json({ error: 'Chaque article doit inclure un variant_id.' })
    }

    const { totalCents: amount, variantsById } = await gatherCartPricing(cartItems)
    if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' })

    for (const item of cartItems) {
      const variant = variantsById.get(item.variant_id)
      if (!variant) {
        return res.status(400).json({ error: `Variant ${item.variant_id} introuvable` })
      }
      if (variant.item_id !== item.item_id) {
        return res.status(400).json({ error: 'Variant et produit incompatibles' })
      }
      if (variant.stock != null && variant.stock < item.quantity) {
        return res.status(400).json({ error: 'Stock insuffisant pour un des variants' })
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
    return res.status(500).json({ error: 'Checkout failed' })
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
app.post('/api/contact', upload.single('attachment'), async (req, res) => {
  try {
    const { name, email, subject, message } = req.body
    const attachment = req.file

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Tous les champs sont requis (nom, email, sujet, message)' })
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' })
    }

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
    return res.status(500).json({ error: 'Erreur lors de l\'envoi du message' })
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

// Run cleanup on server start
cleanupAbandonedOrders()

// Run cleanup every 6 hours
setInterval(cleanupAbandonedOrders, 6 * 60 * 60 * 1000)

// Manual cleanup endpoint (admin only - for testing)
app.post('/api/admin/cleanup-orders', async (req, res) => {
  try {
    const result = await cleanupAbandonedOrders()
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ error: 'Cleanup failed' })
  }
})

app.listen(PORT, () => {
  console.log(`[api] listening on :${PORT}`)
})
