// ============================================================
// 更新个人信息
// PATCH /api/users/me
// 需认证
// ============================================================

import { defineEventHandler } from 'h3'
import { updateUserInfo } from '../../services/user.service'
import { success, error } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }

    const body = await readBody(event)
    const user = await updateUserInfo(auth.id, body)
    return success(user)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
