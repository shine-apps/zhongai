// ============================================================
// 认证服务 — 微信登录、Token 刷新、手机绑定
// ============================================================

import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users, pointAccounts } from '../db/schema'
import { code2Session } from '../utils/wechat'
import { signToken, signRefreshToken, verifyToken } from '../utils/jwt'
import type { AuthUser } from '../types'

/** 微信登录 */
export async function loginWithWechat(
  code: string,
  nickname?: string,
  avatarUrl?: string,
) {
  // 1. 调用微信 code2Session 获取 openid
  const wxSession = await code2Session(code)

  // 2. 查找已有用户
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.openid, wxSession.openid))
    .limit(1)

  let user = existingUser

  if (!user) {
    // 3. 创建新用户
    const [newUser] = await db
      .insert(users)
      .values({
        openid: wxSession.openid,
        unionId: wxSession.unionid,
        nickname: nickname || '微信用户',
        avatarUrl,
      })
      .returning()

    // 同时创建积分账户
    await db.insert(pointAccounts).values({ userId: newUser.id })

    user = newUser
  }
  else {
    // 更新昵称和头像（如果提供了新的）
    if (nickname || avatarUrl) {
      const updateData: Record<string, any> = { updatedAt: new Date() }
      if (nickname) updateData.nickname = nickname
      if (avatarUrl) updateData.avatarUrl = avatarUrl
      ;[user] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, user.id))
        .returning()
    }
  }

  if (!user) {
    throw createError({
      statusCode: 500,
      message: '用户创建失败',
    })
  }

  // 4. 生成 JWT token 和 refresh token
  const authPayload: AuthUser = {
    id: user.id,
    phone: user.phone || undefined,
    openid: user.openid,
    role: user.role as AuthUser['role'],
    status: user.status as AuthUser['status'],
  }

  const token = signToken(authPayload)
  const refreshToken = signRefreshToken({ id: user.id })

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      realName: user.realName,
      realNameVerified: user.realNameVerified,
      memberNo: user.memberNo,
      role: user.role,
      status: user.status,
      honorLevel: user.honorLevel,
      createdAt: user.createdAt,
    },
  }
}

/** 刷新 Access Token */
export async function refreshAccessToken(refreshToken: string) {
  const payload = verifyToken(refreshToken)
  if (!payload) {
    throw createError({
      statusCode: 401,
      message: 'Refresh Token 无效或已过期',
    })
  }

  // 查询最新用户信息
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.id))
    .limit(1)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '用户不存在',
    })
  }

  if (user.status === 'banned') {
    throw createError({
      statusCode: 403,
      message: '账号已被冻结',
    })
  }

  const authPayload: AuthUser = {
    id: user.id,
    phone: user.phone || undefined,
    openid: user.openid,
    role: user.role as AuthUser['role'],
    status: user.status as AuthUser['status'],
  }

  const newToken = signToken(authPayload)
  const newRefreshToken = signRefreshToken({ id: user.id })

  return {
    token: newToken,
    refreshToken: newRefreshToken,
  }
}

/** 绑定手机号 */
export async function bindPhone(userId: string, phone: string) {
  // 检查手机号是否已被其他用户绑定
  const [existingPhone] = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1)

  if (existingPhone && existingPhone.id !== userId) {
    throw createError({
      statusCode: 409,
      message: '该手机号已被其他账号绑定',
    })
  }

  const [updatedUser] = await db
    .update(users)
    .set({ phone, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning()

  if (!updatedUser) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  return {
    id: updatedUser.id,
    phone: updatedUser.phone,
  }
}
