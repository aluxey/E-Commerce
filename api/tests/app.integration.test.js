import assert from 'node:assert/strict'
import test from 'node:test'
import { createApp } from '../src/server.js'

function createConfig(overrides = {}) {
  return {
    allowedOrigins: ['http://localhost:5173'],
    emailTo: 'shop@example.com',
    isProduction: false,
    rateLimits: {
      api: { windowMs: 60_000, max: 100 },
      checkout: { windowMs: 60_000, max: 100 },
      contact: { windowMs: 60_000, max: 100 },
      admin: { windowMs: 60_000, max: 100 },
    },
    resend: null,
    resendFromEmail: 'Sabbels Handmade <test@example.com>',
    stripe: {
      paymentIntents: {
        create: async () => ({ id: 'pi_default', client_secret: 'cs_default', currency: 'eur', amount: 1000 }),
      },
      webhooks: {
        constructEvent: () => ({ id: 'evt_default', type: 'payment_intent.succeeded', data: { object: { metadata: { order_id: 'order_default' } } } }),
      },
    },
    stripeWebhookSecret: 'whsec_test',
    supabase: {
      auth: {
        getUser: async () => ({ data: { user: null }, error: { message: 'Not implemented' } }),
      },
      from: () => ({
        select() { return this },
        insert: async () => ({ error: null }),
        update() { return this },
        upsert: async () => ({ error: null }),
        delete() { return this },
        eq: async () => ({ data: null, error: null }),
        in: async () => ({ data: [], error: null }),
        lt: async () => ({ data: [], error: null }),
        single: async () => ({ data: null, error: null }),
      }),
    },
    ...overrides,
  }
}

async function withServer(config, run) {
  const { app } = createApp(config)
  const server = await new Promise(resolve => {
    const nextServer = app.listen(0, () => resolve(nextServer))
  })

  const { port } = server.address()
  const baseUrl = `http://127.0.0.1:${port}`

  try {
    await run({ baseUrl })
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()))
    })
  }
}

test('POST /api/checkout creates an order and payment intent', async () => {
  const calls = {
    orderItems: null,
    orderUpdate: null,
    paymentUpsert: null,
  }

  const supabase = {
    auth: {
      getUser: async token => ({ data: { user: token === 'a.b.c' ? { id: 'user_1' } : null }, error: null }),
    },
    from(table) {
      if (table === 'items') {
        return {
          select() {
            return {
              in: async () => ({ data: [{ id: 10, price: 19.9 }], error: null }),
            }
          },
        }
      }

      if (table === 'item_variants') {
        return {
          select() {
            return {
              in: async () => ({ data: [{ id: 20, item_id: 10, price: 21.5, stock: 5 }], error: null }),
            }
          },
        }
      }

      if (table === 'orders') {
        return {
          insert(payload) {
            assert.equal(payload.user_id, 'user_1')
            assert.equal(payload.status, 'pending')
            return {
              select() {
                return {
                  single: async () => ({ data: { id: 'order_123' }, error: null }),
                }
              },
            }
          },
          update(payload) {
            calls.orderUpdate = payload
            return {
              eq: async () => ({ error: null }),
            }
          },
        }
      }

      if (table === 'order_items') {
        return {
          insert: async payload => {
            calls.orderItems = payload
            return { error: null }
          },
        }
      }

      if (table === 'payments') {
        return {
          upsert: async payload => {
            calls.paymentUpsert = payload
            return { error: null }
          },
        }
      }

      throw new Error(`Unexpected table ${table}`)
    },
  }

  const stripe = {
    paymentIntents: {
      create: async payload => {
        assert.equal(payload.amount, 4300)
        assert.equal(payload.currency, 'eur')
        return {
          id: 'pi_123',
          client_secret: 'cs_123',
          currency: 'eur',
          amount: 4300,
          status: 'requires_payment_method',
        }
      },
    },
    webhooks: {
      constructEvent: () => {
        throw new Error('Unexpected webhook call')
      },
    },
  }

  await withServer(createConfig({ supabase, stripe }), async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/checkout`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer a.b.c',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currency: 'EUR',
        cartItems: [{ item_id: 10, variant_id: 20, quantity: 2, customization: { hook_type: 'default' } }],
      }),
    })

    assert.equal(response.status, 200)
    const body = await response.json()
    assert.deepEqual(body, { clientSecret: 'cs_123', orderId: 'order_123' })
    assert.equal(calls.orderItems[0].unit_price, 21.5)
    assert.equal(calls.orderUpdate.payment_intent_id, 'pi_123')
    assert.equal(calls.paymentUpsert.provider_id, 'pi_123')
  })
})

test('POST /api/contact accepts a valid payload without Resend configured', async () => {
  await withServer(createConfig(), async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Sabrina',
        email: 'client@example.com',
        subject: 'question',
        message: 'Bonjour, je voudrais une information.',
      }),
    })

    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.success, true)
  })
})

test('POST /api/stripe/webhook updates order and sends email on paid event', async () => {
  const calls = {
    orderStatusUpdate: null,
    paymentUpsert: null,
    sentEmail: null,
  }

  const resend = {
    emails: {
      send: async payload => {
        calls.sentEmail = payload
        return { id: 'email_1' }
      },
    },
  }

  const supabase = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from(table) {
      if (table === 'stripe_events') {
        return {
          insert: async () => ({ error: null }),
        }
      }

      if (table === 'orders') {
        return {
          update(payload) {
            calls.orderStatusUpdate = payload
            return {
              eq: async () => ({ error: null }),
            }
          },
          select() {
            return {
              eq() {
                return {
                  single: async () => ({
                    data: {
                      id: 'order_paid',
                      user_id: 'user_1',
                      total: 42,
                      created_at: '2026-03-15T10:00:00.000Z',
                      payment_intent_id: 'pi_paid',
                      shipping_address: {
                        name: 'Client Test',
                        line1: '1 rue du Test',
                        line2: '',
                        city: 'Paris',
                        state: '',
                        postal_code: '75001',
                        country: 'FR',
                        phone: '',
                      },
                    },
                    error: null,
                  }),
                }
              },
            }
          },
        }
      }

      if (table === 'payments') {
        return {
          upsert: async payload => {
            calls.paymentUpsert = payload
            return { error: null }
          },
        }
      }

      if (table === 'order_items') {
        return {
          select() {
            return {
              eq: async () => ({
                data: [{
                  item_id: 10,
                  quantity: 2,
                  unit_price: 21,
                  customization: { hook_type: 'default' },
                  items: { name: 'Panier' },
                  item_variants: { size: 'M', sku: 'SKU-1' },
                }],
                error: null,
              }),
            }
          },
        }
      }

      if (table === 'users') {
        return {
          select() {
            return {
              eq() {
                return {
                  single: async () => ({ data: { email: 'client@example.com' }, error: null }),
                }
              },
            }
          },
        }
      }

      throw new Error(`Unexpected table ${table}`)
    },
  }

  const stripe = {
    paymentIntents: {
      create: async () => {
        throw new Error('Unexpected payment intent creation')
      },
    },
    webhooks: {
      constructEvent: () => ({
        id: 'evt_paid',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_paid',
            amount_received: 4200,
            currency: 'eur',
            metadata: { order_id: 'order_paid' },
            shipping: {
              name: 'Client Test',
              phone: '',
              address: {
                line1: '1 rue du Test',
                line2: '',
                city: 'Paris',
                state: '',
                postal_code: '75001',
                country: 'fr',
              },
            },
          },
        },
      }),
    },
  }

  await withServer(createConfig({ resend, stripe, supabase }), async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/stripe/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'sig_test',
      },
      body: JSON.stringify({ ok: true }),
    })

    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.received, true)
    assert.equal(calls.orderStatusUpdate.status, 'paid')
    assert.equal(calls.paymentUpsert.status, 'paid')
    assert.match(calls.sentEmail.subject, /Nouvelle commande/)
  })
})
