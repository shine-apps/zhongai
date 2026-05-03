// ============================================================
// 积分服务 — 积分余额、流水、规则管理、积分变动
// ============================================================

import { eq, and, desc, sql } from 'drizzle-orm'
import { db } from '../db'
import { pointAccounts, pointTransactions, pointRules } from '../db/schema'
import { parsePagination } from '../utils/pagination'
import type { PointType, PointChangeType, PointSourceType } from '../types'

/** 获取积分余额 */
export async function getBalance(userId: string) {
  const [account] = await db
    .select()
    .from(pointAccounts)
    .where(eq(pointAccounts.userId, userId))
    .limit(1)

  if (!account) {
    throw createError({
      statusCode: 404,
      message: '积分账户不存在',
    })
  }

  return {
    activityPointsBalance: account.activityPointsBalance,
    activityPointsTotal: account.activityPointsTotal,
    donationPointsBalance: account.donationPointsBalance,
    donationPointsTotal: account.donationPointsTotal,
    totalBalance: (account.activityPointsBalance || 0) + (account.donationPointsBalance || 0),
  }
}

/** 获取积分流水 */
export async function getTransactions(userId: string, query: Record<string, any>) {
  const { page, pageSize, limit, offset } = parsePagination(query)

  const conditions = [eq(pointTransactions.userId, userId)]

  if (query.pointType) {
    conditions.push(eq(pointTransactions.pointType, query.pointType as string))
  }

  if (query.changeType) {
    conditions.push(eq(pointTransactions.changeType, query.changeType as string))
  }

  const whereClause = and(...conditions)

  const [list, countResult] = await Promise.all([
    db
      .select()
      .from(pointTransactions)
      .where(whereClause)
      .orderBy(desc(pointTransactions.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(pointTransactions)
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

/** 获取积分规则列表 */
export async function getRules() {
  const list = await db
    .select()
    .from(pointRules)
    .orderBy(desc(pointRules.createdAt))

  return list
}

/** 创建积分规则 */
export async function createRule(data: Record<string, any>) {
  const [rule] = await db
    .insert(pointRules)
    .values({
      ruleType: data.ruleType,
      pointType: data.pointType,
      pointsPerUnit: data.pointsPerUnit,
      unitDesc: data.unitDesc,
      minAmount: data.minAmount || '0',
      isActive: data.isActive ?? true,
    })
    .returning()

  return rule
}

/** 更新积分规则 */
export async function updateRule(id: string, data: Record<string, any>) {
  const [existing] = await db
    .select()
    .from(pointRules)
    .where(eq(pointRules.id, id))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '积分规则不存在',
    })
  }

  const forbiddenFields = ['id', 'createdAt']
  const updateData: Record<string, any> = { updatedAt: new Date() }

  for (const [key, value] of Object.entries(data)) {
    if (!forbiddenFields.includes(key) && value !== undefined) {
      updateData[key] = value
    }
  }

  const [updated] = await db
    .update(pointRules)
    .set(updateData)
    .where(eq(pointRules.id, id))
    .returning()

  return updated
}

/** 手动调整积分（管理员操作） */
export async function adjustPoints(
  userId: string,
  pointType: PointType,
  amount: number,
  sourceType: PointSourceType,
  sourceId: string,
  description: string,
) {
  if (amount > 0) {
    return await earnPoints(userId, pointType, amount, sourceType, sourceId, description)
  }
  else if (amount < 0) {
    return await spendPoints(userId, pointType, Math.abs(amount), sourceType, sourceId, description)
  }
  else {
    throw createError({
      statusCode: 400,
      message: '调整金额不能为 0',
    })
  }
}

/**
 * 获取积分（内部方法）
 * 在事务中操作：更新 point_accounts 余额 + 插入 point_transactions 流水
 */
export async function earnPoints(
  userId: string,
  pointType: PointType,
  amount: number,
  sourceType: PointSourceType,
  sourceId: string,
  description: string,
): Promise<number> {
  if (amount <= 0) {
    throw createError({
      statusCode: 400,
      message: '获取积分金额必须大于 0',
    })
  }

  // 确定更新哪个积分字段
  const isActivity = pointType === 'activity' || pointType === 'checkin'
  const balanceField = isActivity
    ? pointAccounts.activityPointsBalance
    : pointAccounts.donationPointsBalance
  const totalField = isActivity
    ? pointAccounts.activityPointsTotal
    : pointAccounts.donationPointsTotal

  // 使用事务
  const result = await db.transaction(async (tx) => {
    // 1. 查找或创建积分账户
    const [account] = await tx
      .select()
      .from(pointAccounts)
      .where(eq(pointAccounts.userId, userId))
      .limit(1)

    if (!account) {
      // 自动创建积分账户
      await tx.insert(pointAccounts).values({ userId })
    }

    // 2. 更新余额（原子操作）
    const [updated] = await tx
      .update(pointAccounts)
      .set({
        [isActivity ? 'activityPointsBalance' : 'donationPointsBalance']:
          sql`${balanceField} + ${amount}`,
        [isActivity ? 'activityPointsTotal' : 'donationPointsTotal']:
          sql`${totalField} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(pointAccounts.userId, userId))
      .returning()

    const newBalance = isActivity
      ? updated.activityPointsBalance
      : updated.donationPointsBalance

    // 3. 插入流水记录
    await tx.insert(pointTransactions).values({
      userId,
      pointType,
      changeType: 'earn',
      amount,
      balanceAfter: newBalance!,
      sourceType,
      sourceId,
      description,
    })

    return newBalance
  })

  return result!
}

/**
 * 消耗积分（内部方法）
 * 在事务中操作：更新 point_accounts 余额 + 插入 point_transactions 流水
 */
export async function spendPoints(
  userId: string,
  pointType: PointType,
  amount: number,
  sourceType: PointSourceType,
  sourceId: string,
  description: string,
): Promise<number> {
  if (amount <= 0) {
    throw createError({
      statusCode: 400,
      message: '消耗积分金额必须大于 0',
    })
  }

  // 确定更新哪个积分字段
  const isActivity = pointType === 'activity' || pointType === 'checkin'
  const balanceField = isActivity
    ? pointAccounts.activityPointsBalance
    : pointAccounts.donationPointsBalance

  // 使用事务
  const result = await db.transaction(async (tx) => {
    // 1. 查找积分账户
    const [account] = await tx
      .select()
      .from(pointAccounts)
      .where(eq(pointAccounts.userId, userId))
      .limit(1)

    if (!account) {
      throw createError({
        statusCode: 404,
        message: '积分账户不存在',
      })
    }

    const currentBalance = isActivity
      ? account.activityPointsBalance
      : account.donationPointsBalance

    if ((currentBalance || 0) < amount) {
      throw createError({
        statusCode: 400,
        message: `${isActivity ? '活动' : '捐助'}积分余额不足，当前余额 ${currentBalance || 0}`,
      })
    }

    // 2. 更新余额（原子操作）
    const [updated] = await tx
      .update(pointAccounts)
      .set({
        [isActivity ? 'activityPointsBalance' : 'donationPointsBalance']:
          sql`${balanceField} - ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(pointAccounts.userId, userId))
      .returning()

    const newBalance = isActivity
      ? updated.activityPointsBalance
      : updated.donationPointsBalance

    // 3. 插入流水记录
    await tx.insert(pointTransactions).values({
      userId,
      pointType,
      changeType: 'spend',
      amount: -amount,
      balanceAfter: newBalance!,
      sourceType,
      sourceId,
      description,
    })

    return newBalance
  })

  return result!
}
