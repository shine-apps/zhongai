// ============================================================
// 删除相册项
// DELETE /api/activities/:id/gallery/:mediaId
// 需领队/管理员
// ============================================================

import { defineEventHandler } from 'h3'
import { deleteGalleryItem } from '../../../../services/activity.service'
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
    const mediaId = getRouterParam(event, 'mediaId')

    if (!id || !mediaId) {
      return error('缺少活动 ID 或媒体 ID', 400)
    }

    await deleteGalleryItem(mediaId)
    return success(null, '删除成功')
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
