// ============================================================
// 捐助详情
// GET /api/donations/:id
// 需认证
// ============================================================

import { defineEventHandler } from 'h3'
import { getDonationById } from '../../services/donation.service'
import { success, error } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      return error('缺少捐助 ID', 400)
    }

    const donation = await getDonationById(id)
    return success(donation)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
