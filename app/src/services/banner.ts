import { get } from '@/utils/request'
import type { Banner } from '@/types/banner'

/**
 * 获取轮播图列表
 */
export function getBanners(): Promise<Banner[]> {
  return get<Banner[]>('/banners')
}
