import { Router } from 'express'
import { sendError } from '../lib/http.js'

export function createAdminRouter({ adminLimiter, authService, orderService }) {
  const router = Router()

  router.post('/admin/cleanup-orders', adminLimiter, authService.requireAdmin, async (_req, res) => {
    try {
      const result = await orderService.cleanupAbandonedOrders()
      return res.json({ success: true, ...result })
    } catch {
      return sendError(res, 500, 'CLEANUP_FAILED', 'Cleanup failed')
    }
  })

  return router
}
