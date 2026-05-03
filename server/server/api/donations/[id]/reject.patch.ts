// ============================================================
// 审核驳回
// PATCH /api/donations/:id/reject
// 需管理员
// ============================================================

import { defineEventHandler } from 'h3'
import { rejectDonation } from '../../../services/donation.service'
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
      return error('缺少捐助 ID', 400)
    }

    const body = await readBody(event)
    const result = await rejectDonation(auth.id, id, body)
    return success(result)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
