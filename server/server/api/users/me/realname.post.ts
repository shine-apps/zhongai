// ============================================================
// 提交实名认证
// POST /api/users/me/realname
// 需认证
// ============================================================

import { defineEventHandler } from 'h3'
import { submitRealName } from '../../../services/user.service'
import { success, error } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }

    const body = await readBody(event)
    const { realName, idCardNo } = body

    if (!realName || !idCardNo) {
      return error('请填写真实姓名和身份证号', 400)
    }

    const result = await submitRealName(auth.id, realName, idCardNo)
    return success(result)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
