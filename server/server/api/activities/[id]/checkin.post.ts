// ============================================================
// GPS 签到
// POST /api/activities/:id/checkin
// 需认证
// ============================================================

import { defineEventHandler } from 'h3'
import { gpsCheckin } from '../../../services/checkin.service'
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
    const { latitude, longitude } = body

    if (!latitude || !longitude) {
      return error('缺少位置信息', 400)
    }

    const checkin = await gpsCheckin(id, auth.id, latitude, longitude)
    return success(checkin)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
