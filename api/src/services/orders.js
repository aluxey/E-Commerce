import { sanitizeText } from '../lib/validation.js'

export function createOrderService({ supabase, stripe, paymentService, emailService }) {
  async function gatherCartPricing(cartItems) {
    if (!cartItems.length) {
      return { totalCents: 0, itemsById: new Map(), variantsById: new Map() }
    }

    const itemIds = [...new Set(cartItems.map(item => item.item_id))]
    const variantIds = [...new Set(cartItems.map(item => item.variant_id).filter(Boolean))]

    const { data: items, error: itemsError } = await supabase.from('items').select('id, price').in('id', itemIds)
    if (itemsError) throw itemsError
    const itemMap = new Map((items || []).map(item => [item.id, Number(item.price)]))

    let variantMap = new Map()
    if (variantIds.length) {
      const { data: variants, error: variantsError } = await supabase
        .from('item_variants')
        .select('id, item_id, price, stock')
        .in('id', variantIds)

      if (variantsError) throw variantsError
      variantMap = new Map(
        (variants || []).map(variant => [variant.id, {
          item_id: variant.item_id,
          price: Number(variant.price),
          stock: variant.stock ?? 0,
        }])
      )
    }

    const total = cartItems.reduce((sum, item) => {
      const basePrice = itemMap.get(item.item_id) || 0
      const variant = item.variant_id ? variantMap.get(item.variant_id) : null
      const price = variant ? variant.price : basePrice
      return sum + price * item.quantity
    }, 0)

    return {
      totalCents: Math.max(0, Math.round(total * 100)),
      itemsById: itemMap,
      variantsById: variantMap,
    }
  }

  async function createCheckout({ userId, currency, cartItems }) {
    const { totalCents: amount, variantsById } = await gatherCartPricing(cartItems)
    if (amount <= 0) {
      return { error: { status: 400, code: 'INVALID_AMOUNT', message: 'Invalid amount' } }
    }

    for (const item of cartItems) {
      const variant = variantsById.get(item.variant_id)
      if (!variant) {
        return { error: { status: 400, code: 'INVALID_VARIANT', message: `Variant ${item.variant_id} introuvable` } }
      }
      if (variant.item_id !== item.item_id) {
        return { error: { status: 400, code: 'ITEM_VARIANT_MISMATCH', message: 'Variant et produit incompatibles' } }
      }
      if (variant.stock != null && variant.stock < item.quantity) {
        return { error: { status: 400, code: 'INSUFFICIENT_STOCK', message: 'Stock insuffisant pour un des variants' } }
      }
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ user_id: userId, status: 'pending', total: amount / 100 })
      .select('id')
      .single()

    if (orderError) throw orderError

    const orderItemsPayload = cartItems.map(item => ({
      order_id: order.id,
      item_id: item.item_id,
      quantity: item.quantity,
      variant_id: item.variant_id,
      unit_price: variantsById.get(item.variant_id)?.price ?? 0,
      customization: item.customization || {},
    }))

    const { error: orderItemsError } = await supabase.from('order_items').insert(orderItemsPayload)
    if (orderItemsError) throw orderItemsError

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        user_id: userId,
        order_id: order.id,
      },
    })

    try {
      await supabase.from('orders').update({ payment_intent_id: paymentIntent.id }).eq('id', order.id)
    } catch {
      // no-op
    }

    try {
      await paymentService.upsertStripePaymentRecord({ orderId: order.id, paymentIntent })
    } catch (error) {
      console.error(`Failed to persist payment record for order ${order.id}:`, error)
    }

    return {
      data: {
        clientSecret: paymentIntent.client_secret,
        orderId: order.id,
      },
    }
  }

  async function saveShippingAddress({ userId, orderId, shippingAddress }) {
    const safeOrderId = sanitizeText(orderId, 64)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, status')
      .eq('id', safeOrderId)
      .single()

    if (orderError || !order) {
      return { error: { status: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found' } }
    }
    if (order.user_id !== userId) {
      return { error: { status: 403, code: 'FORBIDDEN', message: 'Forbidden' } }
    }
    if (!['pending', 'failed'].includes(order.status)) {
      return { error: { status: 409, code: 'ORDER_NOT_EDITABLE', message: 'Order can no longer be updated' } }
    }

    const { error: updateError } = await supabase.from('orders').update({ shipping_address: shippingAddress }).eq('id', safeOrderId)
    if (updateError) throw updateError
    return { data: { ok: true } }
  }

  async function handleWebhookEvent(event) {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const orderId = paymentIntent.metadata?.order_id
        if (!orderId) return

        const updatePayload = { status: 'paid' }
        const shipping = paymentIntent.shipping
        if (shipping && typeof shipping === 'object') {
          updatePayload.shipping_address = {
            name: shipping.name || '',
            phone: shipping.phone || '',
            line1: shipping.address?.line1 || '',
            line2: shipping.address?.line2 || '',
            city: shipping.address?.city || '',
            state: shipping.address?.state || '',
            postal_code: shipping.address?.postal_code || '',
            country: (shipping.address?.country || '').toUpperCase(),
          }
        }

        const { error: updateError } = await supabase.from('orders').update(updatePayload).eq('id', orderId)
        if (updateError) {
          console.error(`[Webhook] Failed to update order ${orderId}:`, updateError)
          return
        }

        try {
          await paymentService.upsertStripePaymentRecord({ orderId, paymentIntent, statusOverride: 'paid' })
        } catch (error) {
          console.error(`[Webhook] Failed to sync payment for order ${orderId}:`, error)
        }

        try {
          await emailService.sendOrderRecapEmail(orderId)
        } catch (error) {
          console.error(`[Webhook] Failed to send email for order ${orderId}:`, error)
        }
        break
      }
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object
        const orderId = paymentIntent.metadata?.order_id
        if (!orderId) return

        const nextStatus = event.type === 'payment_intent.payment_failed' ? 'failed' : 'canceled'
        await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId)
        try {
          await paymentService.upsertStripePaymentRecord({ orderId, paymentIntent, statusOverride: nextStatus })
        } catch (error) {
          console.error(`[Webhook] Failed to sync payment for order ${orderId}:`, error)
        }
        break
      }
      default:
        break
    }
  }

  async function cleanupAbandonedOrders() {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
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
        return { deleted: 0, error: null }
      }

      const orderIds = abandonedOrders.map(order => order.id)
      const { error: itemsError } = await supabase.from('order_items').delete().in('order_id', orderIds)
      if (itemsError) {
        console.error('[Cleanup] Error deleting order items:', itemsError)
      }

      const { error: ordersError } = await supabase.from('orders').delete().in('id', orderIds)
      if (ordersError) {
        console.error('[Cleanup] Error deleting orders:', ordersError)
        return { deleted: 0, error: ordersError }
      }

      return { deleted: orderIds.length, error: null }
    } catch (error) {
      console.error('[Cleanup] Unexpected error:', error)
      return { deleted: 0, error }
    }
  }

  return {
    cleanupAbandonedOrders,
    createCheckout,
    gatherCartPricing,
    handleWebhookEvent,
    saveShippingAddress,
  }
}
