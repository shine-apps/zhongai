// ============================================================
// 积分余额
// GET /api/points/balance
// 需认证
// ============================================================

import { defineEventHandler } from 'h3'
import { getBalance } from '../../services/points.service'
import { success, error } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }

    const balance = await getBalance(auth.id)
    return success(balance)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
