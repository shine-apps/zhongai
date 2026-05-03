// ============================================================
// 积分流水
// GET /api/points/transactions
// 需认证
// ============================================================

import { defineEventHandler } from 'h3'
import { getTransactions } from '../../services/points.service'
import { success, error } from '../../utils/response'
import { parsePagination } from '../../utils/pagination'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }

    const query = getQuery(event)
    const { page, pageSize, limit, offset } = parsePagination(query)

    const filters: any = {}
    if (query.pointType) filters.pointType = query.pointType as string
    if (query.changeType) filters.changeType = query.changeType as string
    if (query.sourceType) filters.sourceType = query.sourceType as string

    const { list, total } = await getTransactions(auth.id, {
      ...filters,
      limit,
      offset,
    })

    return {
      code: 0,
      message: 'success',
      data: {
        list,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    }
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
