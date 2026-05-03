// ============================================================
// 活动相册
// GET /api/activities/:id/gallery
// 公开
// ============================================================

import { defineEventHandler } from 'h3'
import { getActivityGallery } from '../../../services/activity.service'
import { success, error } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      return error('缺少活动 ID', 400)
    }

    const query = getQuery(event)
    const gallery = await getActivityGallery(id, {
      mediaType: query.mediaType as string | undefined,
    })
    return success(gallery)
  } catch (err: any) {
    return error(err.message, err.statusCode || 500)
  }
})
