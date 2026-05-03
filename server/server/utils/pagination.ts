// ============================================================
// 分页工具
// ============================================================

import type { PaginationQuery } from '../types'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 50

export interface PaginationResult {
  page: number
  pageSize: number
  limit: number
  offset: number
}

/** 从查询参数解析分页信息 */
export function parsePagination(query: PaginationQuery): PaginationResult {
  let page = Number(query.page) || DEFAULT_PAGE
  let pageSize = Number(query.pageSize) || DEFAULT_PAGE_SIZE

  // 校正边界值
  if (page < 1) page = DEFAULT_PAGE
  if (pageSize < 1) pageSize = DEFAULT_PAGE_SIZE
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE

  return {
    page,
    pageSize,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }
}
