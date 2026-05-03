// ============================================================
// 签到服务 — GPS 签到、领队确认、签到列表
// ============================================================

import { eq, and, desc, sql } from 'drizzle-orm'
import { db } from '../db'
import { activities, activityCheckins, activityRegistrations } from '../db/schema'
import { parsePagination } from '../utils/pagination'

/** GPS 签到 */
export async function gpsCheckin(
  activityId: string,
  userId: string,
  lat: number,
  lng: number,
) {
  // 1. 验证活动状态（必须为 ongoing）
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
      message: '活动当前不在进行中，无法签到',
    })
  }

  // 2. 验证时间范围
  const now = new Date()
  if (activity.startTime && now < activity.startTime) {
    throw createError({
      statusCode: 400,
      message: '活动尚未开始，无法签到',
    })
  }
  if (activity.endTime && now > activity.endTime) {
    throw createError({
      statusCode: 400,
      message: '活动已结束，无法签到',
    })
  }

  // 3. 验证已报名且审核通过
  const [registration] = await db
    .select()
    .from(activityRegistrations)
    .where(
      and(
        eq(activityRegistrations.activityId, activityId),
        eq(activityRegistrations.userId, userId),
      ),
    )
    .limit(1)

  if (!registration) {
    throw createError({
      statusCode: 400,
      message: '您未报名该活动',
    })
  }

  if (registration.status !== 'approved') {
    throw createError({
      statusCode: 400,
      message: '报名尚未审核通过，无法签到',
    })
  }

  // 4. 验证未重复签到
  const [existingCheckin] = await db
    .select()
    .from(activityCheckins)
    .where(
      and(
        eq(activityCheckins.activityId, activityId),
        eq(activityCheckins.userId, userId),
      ),
    )
    .limit(1)

  if (existingCheckin) {
    throw createError({
      statusCode: 409,
      message: '您已签到，请勿重复签到',
    })
  }

  // 5. GPS 距离验证
  if (activity.latitude && activity.longitude) {
    const activityLat = Number(activity.latitude)
    const activityLng = Number(activity.longitude)
    const distance = calculateDistance(lat, lng, activityLat, activityLng)
    const radius = activity.checkinRadius || 200

    if (distance > radius) {
      throw createError({
        statusCode: 400,
        message: `您不在签到范围内，当前距离 ${Math.round(distance)} 米，签到范围 ${radius} 米`,
      })
    }
  }

  // 6. 创建签到记录
  const [checkin] = await db
    .insert(activityCheckins)
    .values({
      activityId,
      userId,
      checkinType: 'location',
      latitude: String(lat),
      longitude: String(lng),
      checkinTime: new Date(),
      verified: false,
    })
    .returning()

  return checkin
}

/** 领队确认签到 */
export async function verifyCheckin(checkinId: string, verifiedBy: string) {
  const [existing] = await db
    .select()
    .from(activityCheckins)
    .where(eq(activityCheckins.id, checkinId))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '签到记录不存在',
    })
  }

  if (existing.verified) {
    throw createError({
      statusCode: 400,
      message: '该签到已被确认',
    })
  }

  const [updated] = await db
    .update(activityCheckins)
    .set({
      verified: true,
      verifiedBy,
      verifiedAt: new Date(),
    })
    .where(eq(activityCheckins.id, checkinId))
    .returning()

  return updated
}

/** 获取签到列表 */
export async function getCheckins(activityId: string, query: Record<string, any>) {
  const { page, pageSize, limit, offset } = parsePagination(query)

  const conditions = [eq(activityCheckins.activityId, activityId)]

  if (query.verified !== undefined) {
    conditions.push(eq(activityCheckins.verified, query.verified === 'true'))
  }

  const whereClause = and(...conditions)

  const [list, countResult] = await Promise.all([
    db
      .select()
      .from(activityCheckins)
      .where(whereClause)
      .orderBy(desc(activityCheckins.checkinTime))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(activityCheckins)
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

/** Haversine 公式计算两点之间的距离（单位：米） */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000 // 地球半径，单位：米
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a
    = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRad(lat1))
    * Math.cos(toRad(lat2))
    * Math.sin(dLng / 2)
    * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}
