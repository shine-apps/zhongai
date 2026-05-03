// ============================================================
// 订单详情
// GET /api/mall/orders/:id
// 需认证（只能查看自己的订单）或管理员
// ============================================================

import { defineEventHandler } from 'h3'
import { getOrderById } from '../../../services/mall.service'
import { success, error } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      return error('缺少订单 ID', 400)
    }

    const order = await getOrderById(id)

    // 非管理员只能查看自己的订单
    if (auth.role !== 'admin' && order.userId !== auth.id) {
      return error('无权查看该订单', 403)
    }

    return success(order)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
