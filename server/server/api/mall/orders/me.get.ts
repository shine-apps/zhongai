// ============================================================
// 我的订单
// GET /api/mall/orders/me?status=&page=1&pageSize=10
// 需认证
// ============================================================

import { defineEventHandler } from 'h3'
import { getMyOrders } from '../../../services/mall.service'
import { success, error } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }

    const query = getQuery(event)
    const result = await getMyOrders(auth.id, query)

    return {
      code: 0,
      message: 'success',
      data: result,
    }
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
