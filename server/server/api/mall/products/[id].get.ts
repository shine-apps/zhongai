// ============================================================
// 商品详情（公开）
// GET /api/mall/products/:id
// ============================================================

import { defineEventHandler } from 'h3'
import { getProductById } from '../../../services/mall.service'
import { success, error } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      return error('缺少商品 ID', 400)
    }

    const product = await getProductById(id)
    return success(product)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
