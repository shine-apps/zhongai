// ============================================================
// 创建活动
// POST /api/activities
// 需领队/管理员
// ============================================================

import { defineEventHandler } from 'h3'
import { createActivity } from '../../services/activity.service'
import { success, error } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }
    if (auth.role !== 'admin' && auth.role !== 'leader') {
      return error('无权限访问，需要领队或管理员权限', 403)
    }

    const body = await readBody(event)
    const activity = await createActivity(body, auth.id)
    return success(activity)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
