import { Router } from 'express'
import { sendError } from '../lib/http.js'
import { normalizeShippingAddress, sanitizeText, validateAndNormalizeCheckoutPayload } from '../lib/validation.js'

export function createCheckoutRouter({ authService, checkoutLimiter, orderService }) {
  const router = Router()

  router.post('/checkout', checkoutLimiter, async (req, res) => {
    try {
      const user = await authService.getUserFromAuthHeader(req.headers.authorization)
      if (!user) return sendError(res, 401, 'UNAUTHORIZED', 'Unauthorized')

      const validation = validateAndNormalizeCheckoutPayload(req.body)
      if (!validation.ok) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid checkout payload', validation.details)
      }

      const result = await orderService.createCheckout({
        userId: user.id,
        ...validation.value,
      })

      if (result.error) {
        return sendError(res, result.error.status, result.error.code, result.error.message)
      }

      return res.status(200).json(result.data)
    } catch (error) {
      console.error('Checkout error:', error)
      return sendError(res, 500, 'CHECKOUT_FAILED', 'Checkout failed')
    }
  })

  router.post('/orders/:orderId/shipping', checkoutLimiter, async (req, res) => {
    try {
      const user = await authService.getUserFromAuthHeader(req.headers.authorization)
      if (!user) return sendError(res, 401, 'UNAUTHORIZED', 'Unauthorized')

      const orderId = sanitizeText(req.params?.orderId, 64)
      if (!orderId) return sendError(res, 400, 'INVALID_ORDER_ID', 'Invalid order id')

      const shippingValidation = normalizeShippingAddress(req.body?.shippingAddress)
      if (!shippingValidation.ok) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid shipping payload', shippingValidation.details)
      }

      const result = await orderService.saveShippingAddress({
        userId: user.id,
        orderId,
        shippingAddress: shippingValidation.value,
      })

      if (result.error) {
        return sendError(res, result.error.status, result.error.code, result.error.message)
      }

      return res.status(200).json(result.data)
    } catch (error) {
      console.error('Shipping update error:', error)
      return sendError(res, 500, 'ORDER_UPDATE_FAILED', 'Failed to save shipping address')
    }
  })

  return router
}
