// ============================================================
// 活动详情
// GET /api/activities/:id
// 公开
// ============================================================

import { defineEventHandler } from 'h3'
import { getActivityById } from '../../services/activity.service'
import { success, error } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      return error('缺少活动 ID', 400)
    }

    const activity = await getActivityById(id)
    return success(activity)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
