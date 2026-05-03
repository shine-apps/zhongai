// ============================================================
// 手动调整积分
// POST /api/points/adjust
// 需管理员
// ============================================================

import { defineEventHandler } from 'h3'
import { adjustPoints } from '../../services/points.service'
import { success, error } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }
    if (auth.role !== 'admin') {
      return error('无权限访问，需要管理员权限', 403)
    }

    const body = await readBody(event)
    const { userId, pointType, amount, description } = body

    if (!userId || !pointType || !amount) {
      return error('缺少必要参数', 400)
    }

    const result = await adjustPoints(auth.id, {
      userId,
      pointType,
      amount,
      description,
    })
    return success(result)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
