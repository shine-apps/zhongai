// ============================================================
// 调整相册排序
// PATCH /api/activities/:id/gallery/sort
// 需领队/管理员
// ============================================================

import { defineEventHandler } from 'h3'
import { sortGalleryItems } from '../../../../services/activity.service'
import { success, error } from '../../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth
    if (!auth) {
      return error('未登录，请先登录', 401)
    }
    if (auth.role !== 'admin' && auth.role !== 'leader') {
      return error('无权限访问，需要领队或管理员权限', 403)
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      return error('缺少活动 ID', 400)
    }

    const body = await readBody(event)
    const { items } = body

    if (!items || !Array.isArray(items)) {
      return error('请提供排序数据', 400)
    }

    const result = await sortGalleryItems(items)
    return success(result)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
