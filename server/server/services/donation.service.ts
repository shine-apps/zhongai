// ============================================================
// 捐助服务 — 捐助提交、审核、查询
// ============================================================

import { eq, and, desc, sql } from 'drizzle-orm'
import { db } from '../db'
import { donations } from '../db/schema'
import { parsePagination } from '../utils/pagination'
import { earnPoints } from './points.service'

/** 提交捐助凭证 */
export async function createDonation(userId: string, data: Record<string, any>) {
  const [donation] = await db
    .insert(donations)
    .values({
      userId,
      donationType: data.donationType,
      amount: data.amount,
      materialDesc: data.materialDesc,
      materialValue: data.materialValue,
      evidenceImages: data.evidenceImages || [],
      evidenceDesc: data.evidenceDesc,
      status: 'pending',
    })
    .returning()

  return donation
}

/** 分页查询捐助列表（管理端） */
export async function getDonationList(query: Record<string, any>) {
  const { page, pageSize, limit, offset } = parsePagination(query)

  const conditions = []

  if (query.status) {
    conditions.push(eq(donations.status, query.status as string))
  }

  if (query.donationType) {
    conditions.push(eq(donations.donationType, query.donationType as string))
  }

  if (query.userId) {
    conditions.push(eq(donations.userId, query.userId as string))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [list, countResult] = await Promise.all([
    db
      .select()
      .from(donations)
      .where(whereClause)
      .orderBy(desc(donations.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(donations)
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

/** 我的捐助记录 */
export async function getMyDonations(userId: string, query: Record<string, any>) {
  const { page, pageSize, limit, offset } = parsePagination(query)

  const conditions = [eq(donations.userId, userId)]

  if (query.status) {
    conditions.push(eq(donations.status, query.status as string))
  }

  const whereClause = and(...conditions)

  const [list, countResult] = await Promise.all([
    db
      .select()
      .from(donations)
      .where(whereClause)
      .orderBy(desc(donations.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(donations)
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

/** 获取捐助详情 */
export async function getDonationById(id: string) {
  const [donation] = await db
    .select()
    .from(donations)
    .where(eq(donations.id, id))
    .limit(1)

  if (!donation) {
    throw createError({
      statusCode: 404,
      message: '捐助记录不存在',
    })
  }

  return donation
}

/** 审核通过并发放积分 */
export async function approveDonation(
  id: string,
  reviewerId: string,
  pointsToGrant: number,
  remark?: string,
) {
  const [existing] = await db
    .select()
    .from(donations)
    .where(eq(donations.id, id))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '捐助记录不存在',
    })
  }

  if (existing.status !== 'pending') {
    throw createError({
      statusCode: 400,
      message: '只能审核待审核状态的捐助记录',
    })
  }

  if (existing.pointsGranted) {
    throw createError({
      statusCode: 400,
      message: '该捐助记录已发放积分',
    })
  }

  // 更新捐助记录状态
  const [updated] = await db
    .update(donations)
    .set({
      status: 'approved',
      reviewerId,
      reviewedAt: new Date(),
      reviewRemark: remark || null,
      pointsGranted: true,
      updatedAt: new Date(),
    })
    .where(eq(donations.id, id))
    .returning()

  // 发放积分
  if (pointsToGrant > 0) {
    await earnPoints(
      existing.userId,
      'donation',
      pointsToGrant,
      'donation',
      existing.id,
      `捐助积分 - ${existing.donationType}`,
    )
  }

  return updated
}

/** 审核驳回 */
export async function rejectDonation(
  id: string,
  reviewerId: string,
  remark?: string,
) {
  const [existing] = await db
    .select()
    .from(donations)
    .where(eq(donations.id, id))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '捐助记录不存在',
    })
  }

  if (existing.status !== 'pending') {
    throw createError({
      statusCode: 400,
      message: '只能审核待审核状态的捐助记录',
    })
  }

  const [updated] = await db
    .update(donations)
    .set({
      status: 'rejected',
      reviewerId,
      reviewedAt: new Date(),
      reviewRemark: remark || null,
      updatedAt: new Date(),
    })
    .where(eq(donations.id, id))
    .returning()

  return updated
}
