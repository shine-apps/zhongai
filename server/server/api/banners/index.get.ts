// ============================================================
// 获取当前有效的轮播图
// GET /api/banners
// 公开接口
// ============================================================

import { defineEventHandler } from 'h3'
import { getBanners } from '../../services/banner.service'
import { success, error } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const list = await getBanners()
    return success(list)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
