// ============================================================
// 统一响应格式
// ============================================================

import type { PaginationMeta } from '../types'

// ---- 业务错误码 ----
export const ResponseCode = {
  SUCCESS: 0,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  INTERNAL_ERROR: 500,
} as const

// ---- 响应类型 ----
export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
}

export interface PaginatedResponse<T = any> {
  code: number
  message: string
  data: {
    list: T[]
    pagination: PaginationMeta
  }
}

// ---- 工具函数 ----

/** 成功响应 */
export function success<T = any>(data: T, message = 'success'): ApiResponse<T> {
  return {
    code: ResponseCode.SUCCESS,
    message,
    data,
  }
}

/** 错误响应 */
export function error(message: string, code: number = ResponseCode.INTERNAL_ERROR): ApiResponse<null> {
  return {
    code,
    message,
    data: null,
  }
}

/** 分页响应 */
export function paginated<T = any>(
  list: T[],
  total: number,
  page: number,
  pageSize: number,
  message = 'success',
): PaginatedResponse<T> {
  return {
    code: ResponseCode.SUCCESS,
    message,
    data: {
      list,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    },
  }
}
