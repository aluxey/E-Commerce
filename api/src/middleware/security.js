import cors from 'cors'

export function applySecurityMiddleware(app, { allowedOrigins, isProduction }) {
  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site')
    if (isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }
    next()
  })

  app.use(
    cors({
      origin: (origin, callback) => {
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
}
