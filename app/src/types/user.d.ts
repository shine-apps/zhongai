/** 用户信息 */
export interface UserInfo {
  id: number
  openid: string
  nickname: string
  avatarUrl: string
  realName: string
  phone: string
  memberNo: string
  role: 'user' | 'leader' | 'admin'
  status: number
  honorLevel: number
  realNameVerified: boolean
  joinedAt: string
}

/** 积分信息 */
export interface PointsInfo {
  activityBalance: number
  activityTotal: number
  donationBalance: number
  donationTotal: number
}

/** 登录结果 */
export interface LoginResult {
  token: string
  refreshToken: string
  user: UserInfo
}
