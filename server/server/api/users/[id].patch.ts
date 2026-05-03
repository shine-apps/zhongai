// ============================================================
// 更新用户
// PATCH /api/users/:id
// 需管理员
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
    if (auth.role !== 'admin') {
      return error('无权限访问，需要管理员权限', 403)
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      return error('缺少用户 ID', 400)
    }

    const body = await readBody(event)
    const user = await updateUserInfo(id, body)
    return success(user)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
