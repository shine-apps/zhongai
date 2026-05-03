import { get } from '@/utils/request'
import type { PointsBalance, PointTransaction, PointRule } from '@/types/points'
import type { PaginatedData } from '@/types/api'

/**
 * 积分余额
 */
export function getBalance(): Promise<PointsBalance> {
  return get<PointsBalance>('/points/balance')
}

/**
 * 积分流水
 * @param params 分页参数（page, pageSize, pointType 等）
 */
export function getTransactions(params?: Record<string, any>): Promise<PaginatedData<PointTransaction>> {
  return get<PaginatedData<PointTransaction>>('/points/transactions', params)
}

/**
 * 积分规则
 */
export function getRules(): Promise<PointRule[]> {
  return get<PointRule[]>('/points/rules')
}
