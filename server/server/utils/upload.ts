// ============================================================
// 文件上传工具
// ============================================================

import type { FileValidationResult } from '../types'

// ---- 文件大小限制（字节） ----
const MAX_IMAGE_SIZE = 5 * 1024 * 1024       // 5 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024     // 100 MB
const MAX_DOC_SIZE = 10 * 1024 * 1024        // 10 MB

// ---- 允许的文件类型 ----
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
]

export const ALLOWED_DOC_TYPES = [
  'application/pdf',
]

// ---- 图片扩展名映射 ----
const IMAGE_EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

const VIDEO_EXT_MAP: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
}

const DOC_EXT_MAP: Record<string, string> = {
  'application/pdf': 'pdf',
}

/** 校验文件类型和大小 */
export function validateFile(file: File): FileValidationResult {
  const { mimetype, size } = file as any

  if (ALLOWED_IMAGE_TYPES.includes(mimetype)) {
    if (size > MAX_IMAGE_SIZE) {
      return { valid: false, message: '图片大小不能超过 5MB' }
    }
    return { valid: true }
  }

  if (ALLOWED_VIDEO_TYPES.includes(mimetype)) {
    if (size > MAX_VIDEO_SIZE) {
      return { valid: false, message: '视频大小不能超过 100MB' }
    }
    return { valid: true }
  }

  if (ALLOWED_DOC_TYPES.includes(mimetype)) {
    if (size > MAX_DOC_SIZE) {
      return { valid: false, message: '文档大小不能超过 10MB' }
    }
    return { valid: true }
  }

  return { valid: false, message: '不支持的文件类型' }
}

/** 根据 mimetype 生成存储路径（不含文件名） */
export function generateFilePath(mimetype: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  // 确定子目录和扩展名
  let dir = 'other'
  let ext = 'bin'

  if (IMAGE_EXT_MAP[mimetype]) {
    dir = 'images'
    ext = IMAGE_EXT_MAP[mimetype]
  }
  else if (VIDEO_EXT_MAP[mimetype]) {
    dir = 'videos'
    ext = VIDEO_EXT_MAP[mimetype]
  }
  else if (DOC_EXT_MAP[mimetype]) {
    dir = 'docs'
    ext = DOC_EXT_MAP[mimetype]
  }

  return `uploads/${dir}/${year}/${month}/${day}`
}

/** 获取文件扩展名 */
export function getFileExt(mimetype: string): string {
  return IMAGE_EXT_MAP[mimetype]
    || VIDEO_EXT_MAP[mimetype]
    || DOC_EXT_MAP[mimetype]
    || 'bin'
}
