// ============================================================
// 积分规则
// GET /api/points/rules
// 公开
// ============================================================

import { defineEventHandler } from 'h3'
import { getRules } from '../../services/points.service'
import { success, error } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const rules = await getRules({
      isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
    })
    return success(rules)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
