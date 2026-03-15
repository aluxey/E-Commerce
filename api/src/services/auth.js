import { sendError } from '../lib/http.js'

export function createAuthService({ supabase }) {
  async function getUserFromAuthHeader(authHeader) {
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) return null

    const token = authHeader.slice('Bearer '.length).trim()
    if (!token || token.split('.').length !== 3) return null

    const { data, error } = await supabase.auth.getUser(token)
    if (error) return null
    return data.user
  }

  async function getUserProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('id', userId)
      .single()

    if (error) return null
    return data
  }

  async function requireAdmin(req, res, next) {
    try {
      const user = await getUserFromAuthHeader(req.headers.authorization)
      if (!user) return sendError(res, 401, 'UNAUTHORIZED', 'Unauthorized')

      const profile = await getUserProfile(user.id)
      if (!profile || profile.role !== 'admin') {
        return sendError(res, 403, 'FORBIDDEN', 'Forbidden: admin access required')
      }

      req.authUser = user
      req.authProfile = profile
      return next()
    } catch (error) {
      console.error('Admin auth error:', error)
      return sendError(res, 500, 'AUTHORIZATION_ERROR', 'Authorization check failed')
    }
  }

  return {
    getUserFromAuthHeader,
    getUserProfile,
    requireAdmin,
  }
}
