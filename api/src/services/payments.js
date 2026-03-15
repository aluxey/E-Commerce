const DUPLICATE_STRIPE_EVENT_CODES = new Set(['23505', '409'])

export function createPaymentService({ supabase }) {
  async function acquireStripeEventLock(eventId) {
    if (!eventId) return { acquired: true }

    const { error } = await supabase.from('stripe_events').insert({ event_id: eventId })
    if (!error) return { acquired: true }

    if (DUPLICATE_STRIPE_EVENT_CODES.has(String(error.code || ''))) {
      return { acquired: false, duplicate: true }
    }
    if (typeof error.message === 'string' && /duplicate key/i.test(error.message)) {
      return { acquired: false, duplicate: true }
    }

    throw error
  }

  async function releaseStripeEventLock(eventId) {
    if (!eventId) return
    const { error } = await supabase.from('stripe_events').delete().eq('event_id', eventId)
    if (error) {
      console.error(`[Webhook] Failed to release stripe event lock for ${eventId}:`, error)
    }
  }

  async function upsertStripePaymentRecord({ orderId, paymentIntent, statusOverride }) {
    if (!paymentIntent?.id) return

    const amount = Number(paymentIntent.amount_received || paymentIntent.amount || 0) / 100
    const payload = {
      order_id: orderId,
      provider: 'stripe',
      provider_id: paymentIntent.id,
      amount,
      currency: String(paymentIntent.currency || 'eur').toLowerCase(),
      status: statusOverride || paymentIntent.status || 'pending',
      raw: paymentIntent,
    }

    const { error } = await supabase.from('payments').upsert(payload, { onConflict: 'provider,provider_id' })
    if (error) throw error
  }

  return {
    acquireStripeEventLock,
    releaseStripeEventLock,
    upsertStripePaymentRecord,
  }
}
