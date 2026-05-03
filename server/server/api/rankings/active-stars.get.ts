// ============================================================
// 近期活跃之星
// GET /api/rankings/active-stars
// 公开接口
// ============================================================

import { defineEventHandler } from 'h3'
import { getActiveStars } from '../../services/ranking.service'
import { success, error } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const list = await getActiveStars()

    return success(list)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
