// ============================================================
// 删除帖子
// DELETE /api/market/posts/:id
// 需认证，只能删除自己的帖子
// ============================================================

import { defineEventHandler } from 'h3'
import { deletePost } from '../../../services/market.service'
import { success, error } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      return error('缺少帖子 ID', 400)
    }

    const result = await deletePost(id, auth.id)
    return success(result)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
