// ============================================================
// 创建兑换订单
// POST /api/mall/orders
// 需认证
// body: { items, shippingName, shippingPhone, shippingAddress, remark? }
// ============================================================

import { defineEventHandler } from 'h3'
import { createOrder } from '../../../services/mall.service'
import { success, error } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }

    const body = await readBody(event)
    const order = await createOrder(auth.id, body)

    return success(order)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
