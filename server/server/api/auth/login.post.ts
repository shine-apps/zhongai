// ============================================================
// 微信登录
// POST /api/auth/login
// ============================================================

import { defineEventHandler } from 'h3'
import { loginWithWechat } from '../../services/auth.service'
import { success, error } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { code } = body

    if (!code) {
      return error('缺少微信登录 code', 400)
    }

    const result = await loginWithWechat(code)
    return success(result)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
