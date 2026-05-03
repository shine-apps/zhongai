// ============================================================
// 商品列表（公开）
// GET /api/mall/products?keyword=&productType=&isFeatured=&page=1&pageSize=10
// ============================================================

import { defineEventHandler } from 'h3'
import { getProductList } from '../../../services/mall.service'
import { success, error } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const result = await getProductList(query)

    return {
      code: 0,
      message: 'success',
      data: result,
    }
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
