// ============================================================
// 帖子详情
// GET /api/market/posts/:id
// 公开接口
// ============================================================

import { defineEventHandler } from 'h3'
import { getPostById } from '../../../services/market.service'
import { success, error } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      return error('缺少帖子 ID', 400)
    }

    const post = await getPostById(id)
    return success(post)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
