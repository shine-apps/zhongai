/** 积分流水 */
export interface PointTransaction {
  id: number
  userId: number
  pointType: 'activity' | 'donation'
  changeType: 'earn' | 'spend'
  amount: number
  balanceAfter: number
  sourceType: string
  description: string
  createdAt: string
}

/** 积分规则 */
export interface PointRule {
  id: number
  ruleType: string
  pointType: 'activity' | 'donation'
  pointsPerUnit: number
  unitDesc: string
  minAmount: number
  isActive: boolean
}

/** 积分余额 */
export interface PointsBalance {
  activityBalance: number
  activityTotal: number
  donationBalance: number
  donationTotal: number
}
