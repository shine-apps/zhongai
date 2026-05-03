// ============================================================
// 活动列表
// GET /api/activities
// 公开
// ============================================================

import { defineEventHandler } from 'h3'
import { getActivityList } from '../../services/activity.service'
import { success, error } from '../../utils/response'
import { parsePagination } from '../../utils/pagination'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { page, pageSize, limit, offset } = parsePagination(query)

    const filters: any = {}
    if (query.category) filters.category = query.category as string
    if (query.status) filters.status = query.status as string
    if (query.keyword) filters.keyword = query.keyword as string

    const { list, total } = await getActivityList({
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
