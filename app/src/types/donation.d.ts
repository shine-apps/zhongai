/** 捐助记录 */
export interface Donation {
  id: number
  userId: number
  donationType: string
  amount: number
  materialDesc: string
  materialValue: number
  evidenceImages: string[]
  evidenceDesc: string
  status: number
  createdAt: string
}
