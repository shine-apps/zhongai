// ============================================================
// 我的捐助记录
// GET /api/donations/me
// 需认证
// ============================================================

import { defineEventHandler } from 'h3'
import { getMyDonations } from '../../services/donation.service'
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
    if (query.status) filters.status = query.status as string
    if (query.donationType) filters.donationType = query.donationType as string

    const { list, total } = await getMyDonations(auth.id, {
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
