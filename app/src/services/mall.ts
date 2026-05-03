import { get, post } from '@/utils/request'
import type { MallProduct, MallOrder } from '@/types/mall'
import type { PaginatedData } from '@/types/api'

/** 商品列表查询参数 */
interface ProductListParams {
  keyword?: string
  productType?: string
  isFeatured?: boolean
  page?: number
  pageSize?: number
}

/** 创建订单参数 */
interface CreateOrderData {
  productId: number
  quantity: number
  pointType: string
  shippingName?: string
  shippingPhone?: string
  shippingAddress?: string
  remark?: string
}

/**
 * 商品列表
 * @param params 查询参数（keyword, productType, isFeatured, page, pageSize）
 */
export function getProductList(params?: ProductListParams): Promise<PaginatedData<MallProduct>> {
  return get<PaginatedData<MallProduct>>('/mall/products', params as Record<string, any>)
}

/**
 * 商品详情
 * @param id 商品 ID
 */
export function getProductDetail(id: number): Promise<MallProduct> {
  return get<MallProduct>(`/mall/products/${id}`)
}

/**
 * 创建兑换订单
 * @param data 订单数据
 */
export function createOrder(data: CreateOrderData): Promise<MallOrder> {
  return post<MallOrder>('/mall/orders', data)
}

/**
 * 我的订单
 * @param params 查询参数（status, page, pageSize）
 */
export function getMyOrders(params?: Record<string, any>): Promise<PaginatedData<MallOrder>> {
  return get<PaginatedData<MallOrder>>('/mall/orders', params)
}

/**
 * 订单详情
 * @param id 订单 ID
 */
export function getOrderDetail(id: number): Promise<MallOrder> {
  return get<MallOrder>(`/mall/orders/${id}`)
}
