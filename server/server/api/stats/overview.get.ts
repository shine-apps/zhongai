// ============================================================
// 平台统计
// GET /api/stats/overview
// 公开
// ============================================================

import { defineEventHandler } from 'h3'
import { getOverview } from '../../services/stats.service'
import { success, error } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const overview = await getOverview()
    return success(overview)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
