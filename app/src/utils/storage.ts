import type { UserInfo } from '@/types/user'

// ==================== Token ====================

/** 获取 token */
export function getToken(): string {
  return uni.getStorageSync('token') || ''
}

/** 设置 token */
export function setToken(token: string): void {
  uni.setStorageSync('token', token)
}

/** 移除 token */
export function removeToken(): void {
  uni.removeStorageSync('token')
}

// ==================== RefreshToken ====================

/** 获取 refreshToken */
export function getRefreshToken(): string {
  return uni.getStorageSync('refreshToken') || ''
}

/** 设置 refreshToken */
export function setRefreshToken(token: string): void {
  uni.setStorageSync('refreshToken', token)
}

/** 移除 refreshToken */
export function removeRefreshToken(): void {
  uni.removeStorageSync('refreshToken')
}

// ==================== UserInfo ====================

/** 获取用户信息 */
export function getUserInfo(): UserInfo | null {
  const info = uni.getStorageSync('userInfo')
  if (info) {
    try {
      return JSON.parse(info) as UserInfo
    } catch {
      return null
    }
  }
  return null
}

/** 设置用户信息 */
export function setUserInfo(info: UserInfo): void {
  uni.setStorageSync('userInfo', JSON.stringify(info))
}

/** 移除用户信息 */
export function removeUserInfo(): void {
  uni.removeStorageSync('userInfo')
}
