import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  openid: varchar('openid', { length: 64 }).unique().notNull(),
  unionId: varchar('union_id', { length: 64 }).unique(),
  phone: varchar('phone', { length: 20 }).unique(),
  nickname: varchar('nickname', { length: 50 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  realName: varchar('real_name', { length: 50 }),
  idCardNo: varchar('id_card_no', { length: 18 }),
  realNameVerified: boolean('real_name_verified').default(false),
  memberNo: varchar('member_no', { length: 20 }).unique(),
  role: varchar('role', { length: 20 }).default('volunteer'),
  status: varchar('status', { length: 20 }).default('active'),
  honorLevel: integer('honor_level').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const usersRelations = relations(users, ({ many }) => ({
  pointAccounts: many(() => require('./point-accounts').pointAccounts),
  pointTransactions: many(() => require('./point-transactions').pointTransactions),
  organizedActivities: many(() => require('./activities').activities),
  activityRegistrations: many(() => require('./activity-registrations').activityRegistrations),
  activityCheckins: many(() => require('./activity-checkins').activityCheckins),
  verifiedCheckins: many(() => require('./activity-checkins').activityCheckins, {
    relationName: 'verifierCheckins',
  }),
  donations: many(() => require('./donations').donations),
  reviewedDonations: many(() => require('./donations').donations, {
    relationName: 'donationReviewer',
  }),
  marketPosts: many(() => require('./market-posts').marketPosts),
  reviewedMarketPosts: many(() => require('./market-posts').marketPosts, {
    relationName: 'marketPostReviewer',
  }),
  mallOrders: many(() => require('./mall-orders').mallOrders),
}))
