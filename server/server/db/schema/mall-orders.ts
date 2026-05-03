import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const mallOrders = pgTable('mall_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNo: varchar('order_no', { length: 30 }).unique().notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  totalItems: integer('total_items').notNull(),
  activityPointsUsed: integer('activity_points_used').default(0),
  donationPointsUsed: integer('donation_points_used').default(0),
  status: varchar('status', { length: 20 }).default('pending'),
  shippingName: varchar('shipping_name', { length: 50 }),
  shippingPhone: varchar('shipping_phone', { length: 20 }),
  shippingAddress: varchar('shipping_address', { length: 300 }),
  remark: varchar('remark', { length: 200 }),
  adminRemark: varchar('admin_remark', { length: 200 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const mallOrdersRelations = relations(mallOrders, ({ one, many }) => ({
  user: one(users, {
    fields: [mallOrders.userId],
    references: [users.id],
    relationName: 'mallOrders',
  }),
  orderItems: many(() => require('./mall-order-items').mallOrderItems),
}))
