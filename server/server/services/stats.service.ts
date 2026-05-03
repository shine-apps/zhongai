// ============================================================
// 统计服务 — 平台数据概览
// ============================================================

import { sql } from 'drizzle-orm'
import { db } from '../db'
import { users, activities, donations, activityCheckins, pointTransactions } from '../db/schema'

/** 获取平台统计数据 */
export async function getOverview() {
  // 并行查询各项统计数据
  const [
    userCountResult,
    activityCountResult,
    completedActivitiesResult,
    donationAmountResult,
    helpCountResult,
    checkinCountResult,
    totalPointsResult,
  ] = await Promise.all([
    // 总志愿者数（active 用户）
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(sql`${users.status} = 'active'`),

    // 总活动数
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(activities),

    // 已完成活动数（用于估算服务时长）
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(activities)
      .where(sql`${activities.status} = 'completed'`),

    // 总捐助金额（已审核通过的）
    db
      .select({
        total: sql<string>`COALESCE(SUM(CASE WHEN donation_type = 'money' THEN amount::numeric ELSE '0' END), 0)`,
      })
      .from(donations)
      .where(sql`${donations.status} = 'approved'`),

    // 总帮助人次（已审核通过的捐助记录数）
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(donations)
      .where(sql`${donations.status} = 'approved'`),

    // 总签到人次
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(activityCheckins),

    // 总发放积分
    db
      .select({
        total: sql<string>`COALESCE(SUM(CASE WHEN change_type = 'earn' THEN amount ELSE 0 END), 0)`,
      })
      .from(pointTransactions),
  ])

  const completedActivityCount = completedActivitiesResult[0]?.count || 0
  // 估算总服务时长（已完成活动数 * 平均 3 小时）
  const estimatedServiceHours = completedActivityCount * 3

  return {
    totalVolunteers: userCountResult[0]?.count || 0,
    totalActivities: activityCountResult[0]?.count || 0,
    estimatedServiceHours,
    totalDonationAmount: donationAmountResult[0]?.total || '0',
    totalHelpCount: helpCountResult[0]?.count || 0,
    totalCheckins: checkinCountResult[0]?.count || 0,
    totalPointsGranted: totalPointsResult[0]?.total || '0',
  }
}
