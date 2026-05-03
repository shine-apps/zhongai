// ============================================================
// 提交捐助凭证
// POST /api/donations
// 需认证
// ============================================================

import { defineEventHandler } from 'h3'
import { createDonation } from '../../services/donation.service'
import { success, error } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }

    const body = await readBody(event)
    const donation = await createDonation(auth.id, body)
    return success(donation)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
