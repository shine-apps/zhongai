import { get, post, del } from '@/utils/request'
import type { MarketPost } from '@/types/market'
import type { PaginatedData } from '@/types/api'

/**
 * 帖子列表（公开，已审核通过）
 * @param params 查询参数（postType, keyword, page, pageSize）
 */
export function getPostList(params?: Record<string, any>): Promise<PaginatedData<MarketPost>> {
  return get<PaginatedData<MarketPost>>('/market/posts', params)
}

/**
 * 帖子详情
 * @param id 帖子 ID
 */
export function getPostDetail(id: number): Promise<MarketPost> {
  return get<MarketPost>(`/market/posts/${id}`)
}

/**
 * 发布帖子
 * @param data 帖子数据
 */
export function createPost(data: {
  postType: string
  title: string
  content: string
  images?: string[]
  contactInfo: string
  pointTypeUsed: 'activity' | 'donation'
}): Promise<MarketPost> {
  return post<MarketPost>('/market/posts', data)
}

/**
 * 我的帖子
 * @param params 分页参数
 */
export function getMyPosts(params?: Record<string, any>): Promise<PaginatedData<MarketPost>> {
  return get<PaginatedData<MarketPost>>('/market/posts/mine', params)
}

/**
 * 删除帖子
 * @param id 帖子 ID
 */
export function deletePost(id: number): Promise<void> {
  return del<void>(`/market/posts/${id}`)
}
