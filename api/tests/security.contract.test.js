import assert from 'node:assert/strict'
import test from 'node:test'
import { testUtils } from '../src/server.js'

const { createIpRateLimiter, validateAndNormalizeCheckoutPayload, validateContactPayload } = testUtils

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

test('checkout payload validation accepts normalized valid payload', () => {
  const result = validateAndNormalizeCheckoutPayload({
    currency: 'EUR',
    cartItems: [
      { item_id: '12', variant_id: '40', quantity: '2', customization: { hook_type: 'default' } },
    ],
  })

  assert.equal(result.ok, true)
  assert.equal(result.value.currency, 'eur')
  assert.deepEqual(result.value.cartItems[0], {
    item_id: 12,
    variant_id: 40,
    quantity: 2,
    customization: { hook_type: 'default' },
  })
})

test('checkout payload validation rejects invalid items', () => {
  const result = validateAndNormalizeCheckoutPayload({
    currency: 'usd',
    cartItems: [{ item_id: 'abc', variant_id: null, quantity: 999 }],
  })

  assert.equal(result.ok, false)
  assert.ok(Array.isArray(result.details))
  assert.ok(result.details.some(d => d.field === 'currency'))
  assert.ok(result.details.some(d => d.field.includes('item_id')))
  assert.ok(result.details.some(d => d.field.includes('variant_id')))
  assert.ok(result.details.some(d => d.field.includes('quantity')))
})

test('contact payload validation rejects invalid shape', () => {
  const result = validateContactPayload({
    name: 'A',
    email: 'not-an-email',
    subject: 'unknown',
    message: 'no',
  })

  assert.equal(result.ok, false)
  assert.ok(result.details.some(d => d.field === 'name'))
  assert.ok(result.details.some(d => d.field === 'email'))
  assert.ok(result.details.some(d => d.field === 'subject'))
  assert.ok(result.details.some(d => d.field === 'message'))
})

test('IP rate limiter blocks requests above threshold', () => {
  const limiter = createIpRateLimiter({
    windowMs: 60_000,
    max: 2,
    message: 'Too many API requests',
  })
  const req = {
    headers: { 'x-forwarded-for': '10.20.30.40' },
    socket: { remoteAddress: '10.20.30.40' },
  }
  const res = createMockRes()

  let nextCalls = 0
  const next = () => {
    nextCalls += 1
  }

  limiter(req, res, next)
  limiter(req, res, next)
  limiter(req, res, next)

  assert.equal(nextCalls, 2)
  assert.equal(res.statusCode, 429)
  assert.equal(res.body?.code, 'RATE_LIMITED')
  assert.equal(typeof res.body?.details?.retryAfterSeconds, 'number')
})
