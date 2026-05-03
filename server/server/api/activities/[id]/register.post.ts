// ============================================================
// 报名活动
// POST /api/activities/:id/register
// 需认证
// ============================================================

import { defineEventHandler } from 'h3'
import { registerActivity } from '../../../services/activity.service'
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

    const body = await readBody(event)
    const registration = await registerActivity(id, auth.id)
    return success(registration)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
