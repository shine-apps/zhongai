import { get, post } from '@/utils/request'
import type { Donation } from '@/types/donation'
import type { PaginatedData } from '@/types/api'

/**
 * 提交捐助凭证
 * @param data 捐助信息
 */
export function submitDonation(data: {
  donationType: string
  amount?: number
  materialDesc?: string
  materialValue?: number
  evidenceImages?: string[]
  evidenceDesc?: string
}): Promise<Donation> {
  return post<Donation>('/donations', data)
}

/**
 * 我的捐助记录
 * @param params 分页参数
 */
export function getMyDonations(params?: Record<string, any>): Promise<PaginatedData<Donation>> {
  return get<PaginatedData<Donation>>('/donations/mine', params)
}

/**
 * 捐助详情
 * @param id 捐助记录 ID
 */
export function getDonationDetail(id: number): Promise<Donation> {
  return get<Donation>(`/donations/${id}`)
}
