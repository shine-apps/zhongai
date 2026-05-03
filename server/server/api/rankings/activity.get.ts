// ============================================================
// 活动积分排行榜
// GET /api/rankings/activity?period=total&page=1&pageSize=50
// 公开接口
// ============================================================

import { defineEventHandler } from 'h3'
import { getActivityRanking } from '../../services/ranking.service'
import { success, error } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)

    const params = {
      period: (query.period as string) || 'total',
      page: query.page,
      pageSize: query.pageSize,
    }

    const result = await getActivityRanking(params)

    return {
      code: 0,
      message: 'success',
      data: {
        list: result.list,
        pagination: result.pagination,
      },
    }
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
