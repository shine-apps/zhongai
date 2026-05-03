// ============================================================
// 集市帖子列表（公开）
// GET /api/market/posts?postType=&keyword=&page=1&pageSize=10
// 公开接口，只返回 status='approved' 的帖子
// ============================================================

import { defineEventHandler } from 'h3'
import { getPostList } from '../../../services/market.service'
import { success, error } from '../../../utils/response'
import { parsePagination } from '../../../utils/pagination'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { page, pageSize, limit, offset } = parsePagination(query)

    const filters: any = { limit, offset }
    if (query.postType) filters.postType = query.postType as string
    if (query.keyword) filters.keyword = query.keyword as string

    const { list, pagination } = await getPostList(filters)

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
