// ============================================================
// 集市服务 — 帖子发布、审核、查询、删除
// ============================================================

import { eq, and, desc, sql, like } from 'drizzle-orm'
import { db } from '../db'
import { marketPosts, pointRules } from '../db/schema'
import { parsePagination } from '../utils/pagination'
import { spendPoints, earnPoints } from './points.service'

/** 发布集市帖子 */
export async function createPost(userId: string, data: Record<string, any>) {
  // 根据积分规则查询发布帖子所需积分数
  const [rule] = await db
    .select()
    .from(pointRules)
    .where(
      and(
        eq(pointRules.ruleType, 'market_post'),
        eq(pointRules.pointType, data.pointTypeUsed || 'activity'),
        eq(pointRules.isActive, true),
      ),
    )
    .limit(1)

  const pointsCost = rule ? rule.pointsPerUnit : 0

  // 扣减积分
  if (pointsCost > 0) {
    await spendPoints(
      userId,
      data.pointTypeUsed || 'activity',
      pointsCost,
      'market_post',
      '',
      '发布集市帖子',
    )
  }

  // 创建帖子记录
  const [post] = await db
    .insert(marketPosts)
    .values({
      userId,
      postType: data.postType,
      title: data.title,
      content: data.content,
      images: data.images || [],
      contactInfo: data.contactInfo || null,
      pointsCost,
      pointTypeUsed: data.pointTypeUsed || 'activity',
      status: 'pending',
    })
    .returning()

  return post
}

/** 帖子列表（公开，只返回已审核通过的帖子） */
export async function getPostList(query: Record<string, any>) {
  const { page, pageSize, limit, offset } = parsePagination(query)

  const conditions = [eq(marketPosts.status, 'approved')]

  if (query.postType) {
    conditions.push(eq(marketPosts.postType, query.postType as string))
  }

  if (query.keyword) {
    conditions.push(like(marketPosts.title, `%${query.keyword}%`))
  }

  const whereClause = and(...conditions)

  const [list, countResult] = await Promise.all([
    db
      .select()
      .from(marketPosts)
      .where(whereClause)
      .orderBy(desc(marketPosts.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(marketPosts)
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

/** 帖子详情 */
export async function getPostById(id: string) {
  const [post] = await db
    .select()
    .from(marketPosts)
    .where(eq(marketPosts.id, id))
    .limit(1)

  if (!post) {
    throw createError({
      statusCode: 404,
      message: '帖子不存在',
    })
  }

  return post
}

/** 我的帖子（所有状态） */
export async function getMyPosts(userId: string, query: Record<string, any>) {
  const { page, pageSize, limit, offset } = parsePagination(query)

  const conditions = [eq(marketPosts.userId, userId)]

  if (query.status) {
    conditions.push(eq(marketPosts.status, query.status as string))
  }

  const whereClause = and(...conditions)

  const [list, countResult] = await Promise.all([
    db
      .select()
      .from(marketPosts)
      .where(whereClause)
      .orderBy(desc(marketPosts.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(marketPosts)
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

/** 删除自己的帖子（仅 pending/approved 状态可删除） */
export async function deletePost(postId: string, userId: string) {
  const [existing] = await db
    .select()
    .from(marketPosts)
    .where(eq(marketPosts.id, postId))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '帖子不存在',
    })
  }

  if (existing.userId !== userId) {
    throw createError({
      statusCode: 403,
      message: '只能删除自己的帖子',
    })
  }

  if (existing.status !== 'pending' && existing.status !== 'approved') {
    throw createError({
      statusCode: 400,
      message: '当前状态的帖子无法删除',
    })
  }

  await db
    .delete(marketPosts)
    .where(eq(marketPosts.id, postId))

  return { deleted: true }
}

/** 审核通过 */
export async function approvePost(postId: string, reviewerId: string) {
  const [existing] = await db
    .select()
    .from(marketPosts)
    .where(eq(marketPosts.id, postId))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '帖子不存在',
    })
  }

  if (existing.status !== 'pending') {
    throw createError({
      statusCode: 400,
      message: '只能审核待审核状态的帖子',
    })
  }

  const [updated] = await db
    .update(marketPosts)
    .set({
      status: 'approved',
      reviewerId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(marketPosts.id, postId))
    .returning()

  return updated
}

/** 审核驳回（退还积分） */
export async function rejectPost(
  postId: string,
  reviewerId: string,
  remark?: string,
) {
  const [existing] = await db
    .select()
    .from(marketPosts)
    .where(eq(marketPosts.id, postId))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '帖子不存在',
    })
  }

  if (existing.status !== 'pending') {
    throw createError({
      statusCode: 400,
      message: '只能审核待审核状态的帖子',
    })
  }

  // 更新帖子状态
  const [updated] = await db
    .update(marketPosts)
    .set({
      status: 'rejected',
      reviewerId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(marketPosts.id, postId))
    .returning()

  // 退还积分
  if (existing.pointsCost > 0) {
    await earnPoints(
      existing.userId,
      existing.pointTypeUsed as any,
      existing.pointsCost,
      'market_post',
      existing.id,
      '集市帖子审核驳回，退还积分',
    )
  }

  return updated
}

/** 管理端帖子列表（所有状态） */
export async function getAllPosts(query: Record<string, any>) {
  const { page, pageSize, limit, offset } = parsePagination(query)

  const conditions = []

  if (query.status) {
    conditions.push(eq(marketPosts.status, query.status as string))
  }

  if (query.postType) {
    conditions.push(eq(marketPosts.postType, query.postType as string))
  }

  if (query.userId) {
    conditions.push(eq(marketPosts.userId, query.userId as string))
  }

  if (query.keyword) {
    conditions.push(like(marketPosts.title, `%${query.keyword}%`))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [list, countResult] = await Promise.all([
    db
      .select()
      .from(marketPosts)
      .where(whereClause)
      .orderBy(desc(marketPosts.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(marketPosts)
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
