// ============================================================
// 创建商品
// POST /api/mall/products
// 需管理员
// ============================================================

import { defineEventHandler } from 'h3'
import { createProduct } from '../../../services/mall.service'
import { success, error } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }
    if (auth.role !== 'admin') {
      return error('无权限访问，需要管理员权限', 403)
    }

    const body = await readBody(event)
    const product = await createProduct(body)

    return success(product)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
