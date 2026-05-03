// ============================================================
// 报名列表
// GET /api/activities/:id/registrations
// 需发起人/管理员
// ============================================================

import { defineEventHandler } from 'h3'
import { getRegistrations } from '../../../services/activity.service'
import { success, error } from '../../../utils/response'
import { parsePagination } from '../../../utils/pagination'

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

    const query = getQuery(event)
    const { page, pageSize, limit, offset } = parsePagination(query)

    const filters: any = {}
    if (query.status) filters.status = query.status as string

    const { list, total } = await getRegistrations(id, {
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
