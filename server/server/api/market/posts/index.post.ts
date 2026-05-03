// ============================================================
// 发布集市帖子
// POST /api/market/posts
// 需认证
// ============================================================

import { defineEventHandler } from 'h3'
import { createPost } from '../../../services/market.service'
import { success, error } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }

    const body = await readBody(event)
    const post = await createPost(auth.id, body)

    return success(post)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
