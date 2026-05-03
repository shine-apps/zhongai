// ============================================================
// 更新订单状态
// PATCH /api/mall/orders/:id
// 需管理员
// body: { status, adminRemark? }
// ============================================================

import { defineEventHandler } from 'h3'
import { updateOrderStatus } from '../../../services/mall.service'
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

    const id = getRouterParam(event, 'id')
    if (!id) {
      return error('缺少订单 ID', 400)
    }

    const body = await readBody(event)

    if (!body.status) {
      return error('缺少订单状态', 400)
    }

    const order = await updateOrderStatus(id, body.status, body.adminRemark)

    return success(order)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
