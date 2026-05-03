// ============================================================
// 活动服务 — 活动 CRUD、报名、签到、相册管理
// ============================================================

import { eq, and, desc, asc, sql, ilike } from 'drizzle-orm'
import { db } from '../db'
import {
  activities,
  activityRegistrations,
  activityCheckins,
  activityGalleries,
} from '../db/schema'
import { parsePagination } from '../utils/pagination'

/** 创建活动 */
export async function createActivity(data: Record<string, any>, organizerId: string) {
  const [activity] = await db
    .insert(activities)
    .values({
      ...data,
      organizerId,
      status: data.status || 'draft',
      currentParticipants: 0,
    })
    .returning()

  return activity
}

/** 分页查询活动列表 */
export async function getActivityList(query: Record<string, any>) {
  const { page, pageSize, limit, offset } = parsePagination(query)

  const conditions = []

  if (query.category) {
    conditions.push(eq(activities.category, query.category as string))
  }

  if (query.status) {
    conditions.push(eq(activities.status, query.status as string))
  }

  if (query.keyword) {
    conditions.push(ilike(activities.title, `%${query.keyword}%`))
  }

  if (query.organizerId) {
    conditions.push(eq(activities.organizerId, query.organizerId as string))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [list, countResult] = await Promise.all([
    db
      .select()
      .from(activities)
      .where(whereClause)
      .orderBy(desc(activities.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(activities)
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

/** 获取活动详情（含相册） */
export async function getActivityById(id: string) {
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, id))
    .limit(1)

  if (!activity) {
    throw createError({
      statusCode: 404,
      message: '活动不存在',
    })
  }

  // 获取相册
  const gallery = await db
    .select()
    .from(activityGalleries)
    .where(eq(activityGalleries.activityId, id))
    .orderBy(asc(activityGalleries.sortOrder))

  return {
    ...activity,
    gallery,
  }
}

/** 更新活动 */
export async function updateActivity(id: string, data: Record<string, any>) {
  const [existing] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, id))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '活动不存在',
    })
  }

  // 已发布/进行中的活动不允许修改关键字段
  const protectedFields = ['id', 'organizerId', 'createdAt']
  if (existing.status === 'ongoing' || existing.status === 'completed') {
    protectedFields.push('startTime', 'endTime', 'rewardPoints', 'maxParticipants')
  }

  const updateData: Record<string, any> = { updatedAt: new Date() }

  for (const [key, value] of Object.entries(data)) {
    if (!protectedFields.includes(key) && value !== undefined) {
      updateData[key] = value
    }
  }

  const [updated] = await db
    .update(activities)
    .set(updateData)
    .where(eq(activities.id, id))
    .returning()

  return updated
}

/** 删除活动 */
export async function deleteActivity(id: string) {
  const [existing] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, id))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '活动不存在',
    })
  }

  if (existing.status !== 'draft' && existing.status !== 'cancelled') {
    throw createError({
      statusCode: 400,
      message: '只能删除草稿或已取消的活动',
    })
  }

  await db.delete(activities).where(eq(activities.id, id))

  return { success: true }
}

/** 发布活动 */
export async function publishActivity(id: string) {
  const [existing] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, id))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '活动不存在',
    })
  }

  if (existing.status !== 'draft') {
    throw createError({
      statusCode: 400,
      message: '只能发布草稿状态的活动',
    })
  }

  const [updated] = await db
    .update(activities)
    .set({
      status: 'published',
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(activities.id, id))
    .returning()

  return updated
}

/** 报名活动 */
export async function registerActivity(activityId: string, userId: string) {
  // 检查活动是否存在且状态允许报名
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1)

  if (!activity) {
    throw createError({
      statusCode: 404,
      message: '活动不存在',
    })
  }

  if (activity.status !== 'published' && activity.status !== 'ongoing') {
    throw createError({
      statusCode: 400,
      message: '该活动当前不接受报名',
    })
  }

  // 检查人数限制
  if (
    activity.maxParticipants
    && activity.currentParticipants! >= activity.maxParticipants
  ) {
    throw createError({
      statusCode: 400,
      message: '活动报名人数已满',
    })
  }

  // 检查重复报名
  const [existingReg] = await db
    .select()
    .from(activityRegistrations)
    .where(
      and(
        eq(activityRegistrations.activityId, activityId),
        eq(activityRegistrations.userId, userId),
      ),
    )
    .limit(1)

  if (existingReg) {
    throw createError({
      statusCode: 409,
      message: '已报名该活动，请勿重复报名',
    })
  }

  // 创建报名记录
  const [registration] = await db
    .insert(activityRegistrations)
    .values({
      activityId,
      userId,
      status: 'pending',
    })
    .returning()

  return registration
}

/** 取消报名 */
export async function cancelRegistration(activityId: string, userId: string) {
  const [existing] = await db
    .select()
    .from(activityRegistrations)
    .where(
      and(
        eq(activityRegistrations.activityId, activityId),
        eq(activityRegistrations.userId, userId),
      ),
    )
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '报名记录不存在',
    })
  }

  if (existing.status === 'cancelled') {
    throw createError({
      statusCode: 400,
      message: '已取消报名',
    })
  }

  if (existing.status === 'approved') {
    throw createError({
      statusCode: 400,
      message: '已审核通过的报名不能直接取消，请联系管理员',
    })
  }

  const [updated] = await db
    .update(activityRegistrations)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(activityRegistrations.id, existing.id))
    .returning()

  return updated
}

/** 获取活动报名列表 */
export async function getRegistrations(activityId: string, query: Record<string, any>) {
  const { page, pageSize, limit, offset } = parsePagination(query)

  const conditions = [eq(activityRegistrations.activityId, activityId)]

  if (query.status) {
    conditions.push(eq(activityRegistrations.status, query.status as string))
  }

  const whereClause = and(...conditions)

  const [list, countResult] = await Promise.all([
    db
      .select()
      .from(activityRegistrations)
      .where(whereClause)
      .orderBy(desc(activityRegistrations.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(activityRegistrations)
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

/** 审核报名 */
export async function approveRegistration(registrationId: string, approved: boolean) {
  const [existing] = await db
    .select()
    .from(activityRegistrations)
    .where(eq(activityRegistrations.id, registrationId))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '报名记录不存在',
    })
  }

  if (existing.status !== 'pending') {
    throw createError({
      statusCode: 400,
      message: '只能审核待审核状态的报名',
    })
  }

  const newStatus = approved ? 'approved' : 'rejected'

  const [updated] = await db
    .update(activityRegistrations)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(activityRegistrations.id, registrationId))
    .returning()

  // 如果审核通过，更新活动当前参与人数
  if (approved) {
    await db
      .update(activities)
      .set({
        currentParticipants: sql`${activities.currentParticipants} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(activities.id, existing.activityId))
  }

  return updated
}

/** 完成活动并批量发放积分 */
export async function completeActivity(activityId: string, checkinIds?: string[]) {
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1)

  if (!activity) {
    throw createError({
      statusCode: 404,
      message: '活动不存在',
    })
  }

  if (activity.status !== 'ongoing') {
    throw createError({
      statusCode: 400,
      message: '只能完成进行中的活动',
    })
  }

  // 更新活动状态为已完成
  const [updated] = await db
    .update(activities)
    .set({ status: 'completed', updatedAt: new Date() })
    .where(eq(activities.id, activityId))
    .returning()

  // 标记指定签到记录已发放积分
  if (checkinIds && checkinIds.length > 0) {
    await db
      .update(activityCheckins)
      .set({ pointsGranted: true })
      .where(
        and(
          sql`${activityCheckins.id} = ANY(${checkinIds})`,
          eq(activityCheckins.activityId, activityId),
        ),
      )
  }

  return {
    activity: updated,
    pointsGrantedCount: checkinIds?.length || 0,
  }
}

// ============================================================
// 活动相册管理
// ============================================================

/** 获取活动相册 */
export async function getActivityGallery(activityId: string, query: Record<string, any>) {
  const { page, pageSize, limit, offset } = parsePagination(query)

  const [list, countResult] = await Promise.all([
    db
      .select()
      .from(activityGalleries)
      .where(eq(activityGalleries.activityId, activityId))
      .orderBy(asc(activityGalleries.sortOrder))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(activityGalleries)
      .where(eq(activityGalleries.activityId, activityId)),
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

/** 添加相册项 */
export async function addGalleryItem(activityId: string, data: Record<string, any>) {
  // 检查活动是否存在
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1)

  if (!activity) {
    throw createError({
      statusCode: 404,
      message: '活动不存在',
    })
  }

  // 获取当前最大排序号
  const [maxResult] = await db
    .select({ maxSort: sql<number>`COALESCE(MAX(sort_order), 0)` })
    .from(activityGalleries)
    .where(eq(activityGalleries.activityId, activityId))

  const nextSort = (maxResult?.maxSort || 0) + 1

  const [item] = await db
    .insert(activityGalleries)
    .values({
      activityId,
      mediaType: data.mediaType,
      fileUrl: data.fileUrl,
      thumbnailUrl: data.thumbnailUrl,
      fileSize: data.fileSize,
      width: data.width,
      height: data.height,
      duration: data.duration,
      sortOrder: data.sortOrder ?? nextSort,
    })
    .returning()

  return item
}

/** 删除相册项 */
export async function deleteGalleryItem(galleryItemId: string) {
  const [existing] = await db
    .select()
    .from(activityGalleries)
    .where(eq(activityGalleries.id, galleryItemId))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '相册项不存在',
    })
  }

  await db
    .delete(activityGalleries)
    .where(eq(activityGalleries.id, galleryItemId))

  return { success: true }
}

/** 调整相册排序 */
export async function sortGalleryItems(items: Array<{ id: string, sortOrder: number }>) {
  if (!items || items.length === 0) {
    throw createError({
      statusCode: 400,
      message: '排序数据不能为空',
    })
  }

  // 逐个更新排序
  for (const item of items) {
    await db
      .update(activityGalleries)
      .set({ sortOrder: item.sortOrder })
      .where(eq(activityGalleries.id, item.id))
  }

  return { success: true }
}
