import { sendError } from '../lib/http.js'

export function createIpRateLimiter({ windowMs, max, message }) {
  const bucket = new Map()

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
