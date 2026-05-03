// ============================================================
// API 请求 composable — 封装 $fetch 调用后端 API
// ============================================================

import type { ApiResponse } from '~/server/types'

const apiBaseUrl = '/api'

/** 获取存储的认证 token */
function getToken(): string | null {
  if (import.meta.client) {
    return localStorage.getItem('admin_token')
  }
  return null
}

/** 构建请求头 */
function buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

/** GET 请求 */
export async function useApiGet<T = any>(
  url: string,
  params?: Record<string, any>,
): Promise<ApiResponse<T>> {
  const queryString = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : ''

  return $fetch<ApiResponse<T>>(`${apiBaseUrl}${url}${queryString}`, {
    method: 'GET',
    headers: buildHeaders(),
  })
}

/** POST 请求 */
export async function useApiPost<T = any>(
  url: string,
  body?: any,
): Promise<ApiResponse<T>> {
  return $fetch<ApiResponse<T>>(`${apiBaseUrl}${url}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })
}

/** PATCH 请求 */
export async function useApiPatch<T = any>(
  url: string,
  body?: any,
): Promise<ApiResponse<T>> {
  return $fetch<ApiResponse<T>>(`${apiBaseUrl}${url}`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })
}

/** DELETE 请求 */
export async function useApiDelete<T = any>(
  url: string,
): Promise<ApiResponse<T>> {
  return $fetch<ApiResponse<T>>(`${apiBaseUrl}${url}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  })
}
