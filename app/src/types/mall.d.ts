/** 积分类型 */
export type PointType = 'activity' | 'donation'

/** 商品类型 */
export type ProductType = 'physical' | 'virtual'

/** 订单状态 */
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'

/** 商品 */
export interface MallProduct {
  id: number
  name: string
  description: string
  coverImage: string
  images: string[]
  productType: ProductType
  activityPointsPrice: number
  donationPointsPrice: number
  allowedPointTypes: PointType[]
  stock: number
  stockRemaining: number
  isFeatured: boolean
  sortOrder: number
  status: number
}

/** 兑换订单 */
export interface MallOrder {
  id: number
  orderNo: string
  totalItems: number
  activityPointsUsed: number
  donationPointsUsed: number
  status: OrderStatus
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  remark: string
  adminRemark: string
  createdAt: string
}

/** 订单商品项 */
export interface MallOrderItem {
  id: number
  productId: number
  productName: string
  productImage: string
  quantity: number
  activityPointsCost: number
  donationPointsCost: number
  pointTypeUsed: PointType
}
