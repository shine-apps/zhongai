// ============================================================
// 我的帖子
// GET /api/market/posts/me?page=1&pageSize=10
// 需认证
// ============================================================

import { defineEventHandler } from 'h3'
import { getMyPosts } from '../../../services/market.service'
import { success, error } from '../../../utils/response'
import { parsePagination } from '../../../utils/pagination'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }

    const query = getQuery(event)
    const { page, pageSize, limit, offset } = parsePagination(query)

    const filters: any = { limit, offset }
    if (query.status) filters.status = query.status as string

    const { list, pagination } = await getMyPosts(auth.id, filters)

    return {
      code: 0,
      message: 'success',
      data: {
        list,
        pagination,
      },
    }
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
