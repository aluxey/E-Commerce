const MAX_CART_ITEMS = 100
const MAX_ITEM_QUANTITY = 50
const ALLOWED_CURRENCIES = new Set(['eur'])
const ALLOWED_CONTACT_SUBJECTS = new Set(['custom-order', 'question', 'order-issue', 'collaboration', 'other'])
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function getEnvPositiveInt(name, fallback) {
  const raw = process.env[name]
  if (!raw) return fallback

  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    return fallback
  }

  return parsed
}

export function parsePositiveInt(value) {
  const num = Number(value)
  return Number.isInteger(num) && num > 0 ? num : null
}

export function normalizeCustomization(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input
}

export function sanitizeText(value, maxLength = 255) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

export function normalizeShippingAddress(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, details: [{ field: 'shippingAddress', issue: 'Shipping address is required' }] }
  }

  const address = input.address && typeof input.address === 'object' && !Array.isArray(input.address)
    ? input.address
    : input

  const normalized = {
    name: sanitizeText(input.name ?? input.fullName ?? address.name, 120),
    phone: sanitizeText(input.phone ?? address.phone, 40),
    line1: sanitizeText(address.line1, 120),
    line2: sanitizeText(address.line2, 120),
    city: sanitizeText(address.city, 120),
    state: sanitizeText(address.state, 120),
    postal_code: sanitizeText(address.postal_code ?? address.postalCode, 32),
    country: sanitizeText(address.country, 2).toUpperCase(),
  }

  const details = []
  if (!normalized.name) details.push({ field: 'shippingAddress.name', issue: 'Name is required' })
  if (!normalized.line1) details.push({ field: 'shippingAddress.line1', issue: 'Address line 1 is required' })
  if (!normalized.city) details.push({ field: 'shippingAddress.city', issue: 'City is required' })
  if (!normalized.postal_code) details.push({ field: 'shippingAddress.postal_code', issue: 'Postal code is required' })
  if (!/^[A-Z]{2}$/.test(normalized.country)) {
    details.push({ field: 'shippingAddress.country', issue: 'Country must be a 2-letter ISO code' })
  }

  if (details.length) return { ok: false, details }
  return { ok: true, value: normalized }
}

export function validateAndNormalizeCheckoutPayload(body) {
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
      details.push({ field: `cartItems[${index}].quantity`, issue: `Cannot exceed ${MAX_ITEM_QUANTITY}` })
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
  return { ok: true, value: { currency, cartItems: normalizedItems } }
}

export function validateContactPayload(body) {
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

export const validationConstants = {
  ALLOWED_CONTACT_SUBJECTS,
  ALLOWED_CURRENCIES,
  EMAIL_REGEX,
  MAX_CART_ITEMS,
  MAX_ITEM_QUANTITY,
}
