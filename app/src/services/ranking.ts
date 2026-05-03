import { get } from '@/utils/request'
import type { RankingItem, ActiveStar } from '@/types/ranking'
import type { PaginatedData } from '@/types/api'

/**
 * 活动积分排行榜
 * @param params 查询参数（period: 'all' | 'monthly', page, pageSize）
 */
export function getActivityRanking(params?: Record<string, any>): Promise<PaginatedData<RankingItem>> {
  return get<PaginatedData<RankingItem>>('/rankings/activity', params)
}

/**
 * 捐助积分排行榜
 * @param params 查询参数（period: 'all' | 'yearly', page, pageSize）
 */
export function getDonationRanking(params?: Record<string, any>): Promise<PaginatedData<RankingItem>> {
  return get<PaginatedData<RankingItem>>('/rankings/donation', params)
}

/**
 * 近期活跃之星
 */
export function getActiveStars(): Promise<ActiveStar[]> {
  return get<ActiveStar[]>('/rankings/active-stars')
}
