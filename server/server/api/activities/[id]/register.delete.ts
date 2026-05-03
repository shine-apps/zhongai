// ============================================================
// 取消报名
// DELETE /api/activities/:id/register
// 需认证
// ============================================================

import { defineEventHandler } from 'h3'
import { cancelRegistration } from '../../../services/activity.service'
import { success, error } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      return error('缺少活动 ID', 400)
    }

    await cancelRegistration(id, auth.id)
    return success(null, '取消报名成功')
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
