// ============================================================
// 刷新 Token
// POST /api/auth/refresh
// ============================================================

import { defineEventHandler } from 'h3'
import { refreshAccessToken } from '../../services/auth.service'
import { success, error } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) || {}
    const { refreshToken } = body

    if (!refreshToken) {
      return error('缺少 refreshToken', 400)
    }

    const result = await refreshAccessToken(refreshToken)
    return success(result)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
