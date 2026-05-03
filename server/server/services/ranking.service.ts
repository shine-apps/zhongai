// ============================================================
// 排行榜服务 — 活动积分排行、捐助积分排行、活跃之星
// ============================================================

import { eq, and, desc, sql, gte, count, sum } from 'drizzle-orm'
import { db } from '../db'
import { users, pointAccounts, pointTransactions, activityCheckins } from '../db/schema'
import { parsePagination } from '../utils/pagination'

// ---- 活动积分排行榜 ----

interface RankingParams {
  period?: 'total' | 'monthly'
  page?: number | string
  pageSize?: number | string
}

/** 活动积分排行榜 */
export async function getActivityRanking(params: RankingParams) {
  const { page, pageSize, limit, offset } = parsePagination(params)
  const period = params.period || 'total'

  let query: any

  if (period === 'total') {
    // 查询所有时间的活动积分累计（从 point_accounts.activityPointsTotal）
    query = db
      .select({
        userId: pointAccounts.userId,
        nickname: users.nickname,
        avatarUrl: users.avatarUrl,
        points: pointAccounts.activityPointsTotal,
      })
      .from(pointAccounts)
      .leftJoin(users, eq(pointAccounts.userId, users.id))
      .where(sql`${pointAccounts.activityPointsTotal} > 0`)
      .orderBy(desc(pointAccounts.activityPointsTotal))
  }
  else {
    // monthly: 查询当月的活动积分流水汇总
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    query = db
      .select({
        userId: pointTransactions.userId,
        nickname: users.nickname,
        avatarUrl: users.avatarUrl,
        points: sum(pointTransactions.amount).as('points'),
      })
      .from(pointTransactions)
      .leftJoin(users, eq(pointTransactions.userId, users.id))
      .where(
        and(
          eq(pointTransactions.pointType, 'activity'),
          eq(pointTransactions.changeType, 'earn'),
          gte(pointTransactions.createdAt, monthStart),
        ),
      )
      .groupBy(pointTransactions.userId, users.nickname, users.avatarUrl)
      .orderBy(desc(sql`points`))
  }

  const [list, countResult] = await Promise.all([
    query.limit(limit).offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(
        period === 'total'
          ? db
              .select({ userId: pointAccounts.userId })
              .from(pointAccounts)
              .where(sql`${pointAccounts.activityPointsTotal} > 0`)
              .as('sub')
          : db
              .select({ userId: pointTransactions.userId })
              .from(pointTransactions)
              .where(
                and(
                  eq(pointTransactions.pointType, 'activity'),
                  eq(pointTransactions.changeType, 'earn'),
                  gte(pointTransactions.createdAt, new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
                ),
              )
              .groupBy(pointTransactions.userId)
              .as('sub'),
      ),
  ])

  const total = countResult[0]?.total || 0

  const rankedList = list.map((item: any, index: number) => ({
    rank: offset + index + 1,
    userId: item.userId,
    nickname: item.nickname,
    avatarUrl: item.avatarUrl,
    points: Number(item.points) || 0,
  }))

  return {
    list: rankedList,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

// ---- 捐助积分排行榜 ----

interface DonationRankingParams {
  period?: 'total' | 'yearly'
  page?: number | string
  pageSize?: number | string
}

/** 捐助积分排行榜 */
export async function getDonationRanking(params: DonationRankingParams) {
  const { page, pageSize, limit, offset } = parsePagination(params)
  const period = params.period || 'total'

  let query: any

  if (period === 'total') {
    // 查询所有时间的捐助积分累计（从 point_accounts.donationPointsTotal）
    query = db
      .select({
        userId: pointAccounts.userId,
        nickname: users.nickname,
        avatarUrl: users.avatarUrl,
        points: pointAccounts.donationPointsTotal,
      })
      .from(pointAccounts)
      .leftJoin(users, eq(pointAccounts.userId, users.id))
      .where(sql`${pointAccounts.donationPointsTotal} > 0`)
      .orderBy(desc(pointAccounts.donationPointsTotal))
  }
  else {
    // yearly: 查询当年的捐助积分流水汇总
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)

    query = db
      .select({
        userId: pointTransactions.userId,
        nickname: users.nickname,
        avatarUrl: users.avatarUrl,
        points: sum(pointTransactions.amount).as('points'),
      })
      .from(pointTransactions)
      .leftJoin(users, eq(pointTransactions.userId, users.id))
      .where(
        and(
          eq(pointTransactions.pointType, 'donation'),
          eq(pointTransactions.changeType, 'earn'),
          gte(pointTransactions.createdAt, yearStart),
        ),
      )
      .groupBy(pointTransactions.userId, users.nickname, users.avatarUrl)
      .orderBy(desc(sql`points`))
  }

  const [list, countResult] = await Promise.all([
    query.limit(limit).offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(
        period === 'total'
          ? db
              .select({ userId: pointAccounts.userId })
              .from(pointAccounts)
              .where(sql`${pointAccounts.donationPointsTotal} > 0`)
              .as('sub')
          : db
              .select({ userId: pointTransactions.userId })
              .from(pointTransactions)
              .where(
                and(
                  eq(pointTransactions.pointType, 'donation'),
                  eq(pointTransactions.changeType, 'earn'),
                  gte(pointTransactions.createdAt, new Date(new Date().getFullYear(), 0, 1)),
                ),
              )
              .groupBy(pointTransactions.userId)
              .as('sub'),
      ),
  ])

  const total = countResult[0]?.total || 0

  const rankedList = list.map((item: any, index: number) => ({
    rank: offset + index + 1,
    userId: item.userId,
    nickname: item.nickname,
    avatarUrl: item.avatarUrl,
    points: Number(item.points) || 0,
  }))

  return {
    list: rankedList,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

// ---- 近期活跃之星 ----

/** 近期活跃之星（最近7天签到次数排名） */
export async function getActiveStars() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const list = await db
    .select({
      userId: activityCheckins.userId,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl,
      checkinCount: count(activityCheckins.id).as('checkin_count'),
    })
    .from(activityCheckins)
    .leftJoin(users, eq(activityCheckins.userId, users.id))
    .where(gte(activityCheckins.createdAt, sevenDaysAgo))
    .groupBy(activityCheckins.userId, users.nickname, users.avatarUrl)
    .orderBy(desc(sql`checkin_count`))
    .limit(20)

  return list.map((item: any) => ({
    userId: item.userId,
    nickname: item.nickname,
    avatarUrl: item.avatarUrl,
    checkinCount: Number(item.checkinCount) || 0,
  }))
}
