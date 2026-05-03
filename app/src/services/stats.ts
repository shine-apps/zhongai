import { get } from '@/utils/request'

/**
 * 平台统计数据
 */
export function getOverview(): Promise<any> {
  return get<any>('/stats/overview')
}
