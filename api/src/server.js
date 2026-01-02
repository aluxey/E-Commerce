import express from 'express'
import cors from 'cors'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const PORT = process.env.PORT || 3000
const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables for API server.')
}

const stripe = new Stripe(STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' })
const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '')

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

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object
        const orderId = pi.metadata?.order_id
        if (orderId) {
          await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId)
        }
        break
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object
        const orderId = pi.metadata?.order_id
        if (orderId) {
          await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
        }
        break
      }
      default:
        // no-op for now
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

// CORS
app.use(
  cors({
    origin: CLIENT_ORIGIN.length ? CLIENT_ORIGIN : true,
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

app.listen(PORT, () => {
  console.log(`[api] listening on :${PORT}`)
})
