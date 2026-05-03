/** 集市帖子类型 */
export type MarketPostType = 'job_recruit' | 'job_seek' | 'idle_sell' | 'idle_buy'

/** 集市帖子 */
export interface MarketPost {
  id: number
  userId: number
  postType: MarketPostType
  title: string
  content: string
  images: string[]
  contactInfo: string
  pointsCost: number
  pointTypeUsed: 'activity' | 'donation'
  status: number
  createdAt: string
}
