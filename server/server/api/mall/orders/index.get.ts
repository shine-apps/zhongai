// ============================================================
// 管理端订单列表
// GET /api/mall/orders?status=&keyword=&page=1&pageSize=10
// 需管理员
// ============================================================

import { defineEventHandler } from 'h3'
import { getOrderList } from '../../../services/mall.service'
import { success, error } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }
    if (auth.role !== 'admin') {
      return error('无权限访问，需要管理员权限', 403)
    }

    const query = getQuery(event)
    const result = await getOrderList(query)

    return {
      code: 0,
      message: 'success',
      data: result,
    }
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
