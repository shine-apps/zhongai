import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { mallOrders } from './mall-orders'
import { mallProducts } from './mall-products'

export const mallOrderItems = pgTable('mall_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => mallOrders.id).notNull(),
  productId: uuid('product_id').references(() => mallProducts.id).notNull(),
  productName: varchar('product_name', { length: 100 }).notNull(),
  productImage: varchar('product_image', { length: 500 }),
  quantity: integer('quantity').notNull(),
  activityPointsCost: integer('activity_points_cost').notNull(),
  donationPointsCost: integer('donation_points_cost').notNull(),
  pointTypeUsed: varchar('point_type_used', { length: 20 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const mallOrderItemsRelations = relations(mallOrderItems, ({ one }) => ({
  order: one(mallOrders, {
    fields: [mallOrderItems.orderId],
    references: [mallOrders.id],
  }),
  product: one(mallProducts, {
    fields: [mallOrderItems.productId],
    references: [mallProducts.id],
  }),
}))
