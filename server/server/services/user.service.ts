// ============================================================
// 用户服务 — 用户管理、实名认证、角色管理
// ============================================================

import { eq, and, ilike, desc, sql, or } from 'drizzle-orm'
import { db } from '../db'
import { users, pointAccounts } from '../db/schema'
import { parsePagination } from '../utils/pagination'

/** 获取用户详情（含积分账户） */
export async function getUserById(id: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  if (!user) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  // 查询积分账户
  const [account] = await db
    .select()
    .from(pointAccounts)
    .where(eq(pointAccounts.userId, id))
    .limit(1)

  return {
    ...user,
    pointAccount: account || null,
  }
}

/** 分页查询用户列表 */
export async function getUserList(query: Record<string, any>) {
  const { page, pageSize, limit, offset } = parsePagination(query)

  const conditions = []

  if (query.keyword) {
    conditions.push(
      or(
        ilike(users.nickname, `%${query.keyword}%`),
        ilike(users.phone, `%${query.keyword}%`),
        ilike(users.realName, `%${query.keyword}%`),
        ilike(users.memberNo, `%${query.keyword}%`),
      ),
    )
  }

  if (query.role) {
    conditions.push(eq(users.role, query.role as string))
  }

  if (query.status) {
    conditions.push(eq(users.status, query.status as string))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [list, countResult] = await Promise.all([
    db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(whereClause),
  ])

  const total = countResult[0]?.count || 0

  return {
    list,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

/** 更新用户信息 */
export async function updateUserInfo(id: string, data: Record<string, any>) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  // 不允许通过此接口修改的字段
  const forbiddenFields = ['id', 'openid', 'unionId', 'role', 'status', 'realNameVerified', 'createdAt']
  const updateData: Record<string, any> = { updatedAt: new Date() }

  for (const [key, value] of Object.entries(data)) {
    if (!forbiddenFields.includes(key) && value !== undefined) {
      updateData[key] = value
    }
  }

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning()

  return updated
}

/** 提交实名认证 */
export async function submitRealName(id: string, realName: string, idCardNo: string) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  if (existing.realNameVerified) {
    throw createError({
      statusCode: 409,
      message: '已完成实名认证，不可重复提交',
    })
  }

  const [updated] = await db
    .update(users)
    .set({
      realName,
      idCardNo,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning()

  return {
    id: updated.id,
    realName: updated.realName,
    realNameVerified: updated.realNameVerified,
  }
}

/** 审核实名认证 */
export async function approveRealName(id: string, approved: boolean) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  if (!existing.realName || !existing.idCardNo) {
    throw createError({
      statusCode: 400,
      message: '用户未提交实名认证信息',
    })
  }

  const [updated] = await db
    .update(users)
    .set({
      realNameVerified: approved,
      // 如果驳回，清除实名信息
      ...(approved ? {} : { realName: null, idCardNo: null }),
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning()

  return {
    id: updated.id,
    realName: updated.realName,
    realNameVerified: updated.realNameVerified,
  }
}

/** 冻结/解冻用户 */
export async function updateUserStatus(id: string, status: string) {
  const validStatuses = ['active', 'inactive', 'banned']
  if (!validStatuses.includes(status)) {
    throw createError({
      statusCode: 400,
      message: `无效的用户状态: ${status}`,
    })
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  const [updated] = await db
    .update(users)
    .set({ status, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning()

  return {
    id: updated.id,
    status: updated.status,
  }
}

/** 设置用户角色 */
export async function updateUserRole(id: string, role: string) {
  const validRoles = ['admin', 'leader', 'member', 'volunteer']
  if (!validRoles.includes(role)) {
    throw createError({
      statusCode: 400,
      message: `无效的用户角色: ${role}`,
    })
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  const [updated] = await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning()

  return {
    id: updated.id,
    role: updated.role,
  }
}

/** 生成会员编号（格式 ZA-00001） */
export async function generateMemberNo(): Promise<string> {
  // 查询当前最大编号
  const [result] = await db
    .select({ maxNo: sql<string>`MAX(member_no)` })
    .from(users)

  let nextNum = 1

  if (result?.maxNo) {
    // 从 ZA-00001 格式中提取数字部分
    const numStr = result.maxNo.replace('ZA-', '')
    const currentNum = Number.parseInt(numStr, 10)
    if (!Number.isNaN(currentNum)) {
      nextNum = currentNum + 1
    }
  }

  const memberNo = `ZA-${String(nextNum).padStart(5, '0')}`
  return memberNo
}
