// ============================================================
// 获取当前用户信息
// GET /api/users/me
// 需认证
// ============================================================

import { defineEventHandler } from 'h3'
import { getUserById } from '../../services/user.service'
import { success, error } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }

    const user = await getUserById(auth.id)
    return success(user)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
