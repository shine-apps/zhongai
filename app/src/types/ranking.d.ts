/** 排行榜项 */
export interface RankingItem {
  rank: number
  userId: number
  nickname: string
  avatarUrl: string
  points: number
}

/** 近期活跃之星 */
export interface ActiveStar {
  userId: number
  nickname: string
  avatarUrl: string
  checkinCount: number
}
