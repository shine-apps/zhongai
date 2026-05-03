// ============================================================
// JWT 工具
// ============================================================

import jwt from 'jsonwebtoken'
import type { AuthUser } from '../types'

const ACCESS_TOKEN_EXPIRES_IN = '7d'
const REFRESH_TOKEN_EXPIRES_IN = '30d'

/** 获取 JWT 密钥 */
function getJwtSecret(): string {
  const config = useRuntimeConfig()
  return config.jwtSecret as string
}

/** 生成 Access Token（7 天过期） */
export function signToken(payload: AuthUser): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  })
}

/** 生成 Refresh Token（30 天过期） */
export function signRefreshToken(payload: Pick<AuthUser, 'id'>): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  })
}

/** 验证 Token，返回 payload */
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthUser
    return decoded
  }
  catch {
    return null
  }
}
