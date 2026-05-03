import { post } from '@/utils/request'
import type { LoginResult } from '@/types/user'

/**
 * 微信登录
 * @param code 微信登录 code
 * @param nickname 昵称（可选）
 * @param avatarUrl 头像地址（可选）
 */
export function login(code: string, nickname?: string, avatarUrl?: string): Promise<LoginResult> {
  return post<LoginResult>('/auth/login', { code, nickname, avatarUrl })
}

/**
 * 刷新 token
 * @param refreshToken 刷新令牌
 */
export function refreshAccessToken(refreshToken: string): Promise<LoginResult> {
  return post<LoginResult>('/auth/refresh', { refreshToken })
}

/**
 * 绑定手机号
 * @param phone 手机号
 */
export function bindPhone(phone: string): Promise<void> {
  return post<void>('/auth/bindPhone', { phone })
}
