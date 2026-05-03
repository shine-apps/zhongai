/** 通用 API 响应 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/** 分页数据 */
export interface PaginatedData<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/** 分页响应 */
export interface PaginatedResponse<T = any> {
  code: number
  message: string
  data: PaginatedData<T>
}
