// ============================================================
// 轮播图服务 — 轮播图管理
// ============================================================

import { eq, and, asc, desc, sql, lte, gte, isNull } from 'drizzle-orm'
import { db } from '../db'
import { banners } from '../db/schema'
import { parsePagination } from '../utils/pagination'

/** 获取当前有效的轮播图列表（公开） */
export async function getBanners() {
  const now = new Date()

  const list = await db
    .select()
    .from(banners)
    .where(
      and(
        eq(banners.isActive, true),
        // startAt IS NULL OR startAt <= now
        sql`(${isNull(banners.startAt)} OR ${lte(banners.startAt, now)})`,
        // endAt IS NULL OR endAt >= now
        sql`(${isNull(banners.endAt)} OR ${gte(banners.endAt, now)})`,
      ),
    )
    .orderBy(asc(banners.sortOrder))

  return list
}

/** 创建轮播图 */
export async function createBanner(data: Record<string, any>) {
  const [banner] = await db
    .insert(banners)
    .values({
      title: data.title,
      imageUrl: data.imageUrl,
      linkType: data.linkType || null,
      linkValue: data.linkValue || null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      startAt: data.startAt || null,
      endAt: data.endAt || null,
    })
    .returning()

  return banner
}

/** 更新轮播图 */
export async function updateBanner(id: string, data: Record<string, any>) {
  const [existing] = await db
    .select()
    .from(banners)
    .where(eq(banners.id, id))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '轮播图不存在',
    })
  }

  const forbiddenFields = ['id', 'createdAt']
  const updateData: Record<string, any> = {}

  for (const [key, value] of Object.entries(data)) {
    if (!forbiddenFields.includes(key) && value !== undefined) {
      updateData[key] = value
    }
  }

  const [updated] = await db
    .update(banners)
    .set(updateData)
    .where(eq(banners.id, id))
    .returning()

  return updated
}

/** 删除轮播图 */
export async function deleteBanner(id: string) {
  const [existing] = await db
    .select()
    .from(banners)
    .where(eq(banners.id, id))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '轮播图不存在',
    })
  }

  await db
    .delete(banners)
    .where(eq(banners.id, id))

  return { deleted: true }
}

/** 管理端轮播图列表（含已过期/未启用的） */
export async function getAllBanners(query: Record<string, any>) {
  const { page, pageSize, limit, offset } = parsePagination(query)

  const [list, countResult] = await Promise.all([
    db
      .select()
      .from(banners)
      .orderBy(asc(banners.sortOrder), desc(banners.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(banners),
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
