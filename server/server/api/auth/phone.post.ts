// ============================================================
// 绑定手机号
// POST /api/auth/phone
// 需认证
// ============================================================

import { defineEventHandler } from 'h3'
import { bindPhone } from '../../services/auth.service'
import { success, error } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }

    const body = await readBody(event)
    const { code } = body

    if (!code) {
      return error('缺少手机号验证码', 400)
    }

    const result = await bindPhone(auth.id, code)
    return success(result)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
