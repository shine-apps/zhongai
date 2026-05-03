import { upload } from '@/utils/request'

/**
 * 上传图片
 * @param filePath 本地图片路径
 * @returns 上传结果，包含 url
 */
export function uploadImage(filePath: string): Promise<{ url: string }> {
  return upload<{ url: string }>('/upload/image', filePath)
}

/**
 * 上传视频
 * @param filePath 本地视频路径
 * @returns 上传结果，包含 url 和 thumbnailUrl
 */
export function uploadVideo(filePath: string): Promise<{ url: string; thumbnailUrl: string }> {
  return upload<{ url: string; thumbnailUrl: string }>('/upload/video', filePath)
}
