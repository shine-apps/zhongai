// ============================================================
// 用户列表
// GET /api/users
// 需管理员
// ============================================================

import { defineEventHandler } from 'h3'
import { getUserList } from '../../services/user.service'
import { success, error } from '../../utils/response'
import { parsePagination } from '../../utils/pagination'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }
    if (auth.role !== 'admin') {
      return error('无权限访问，需要管理员权限', 403)
    }

    const query = getQuery(event)
    const { page, pageSize, limit, offset } = parsePagination(query)

    const filters: any = {}
    if (query.role) filters.role = query.role as string
    if (query.status) filters.status = query.status as string
    if (query.keyword) filters.keyword = query.keyword as string

    const { list, total } = await getUserList({
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
