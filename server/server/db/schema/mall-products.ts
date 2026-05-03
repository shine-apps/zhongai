import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const mallProducts = pgTable('mall_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  coverImage: varchar('cover_image', { length: 500 }),
  images: jsonb('images').default([]),
  productType: varchar('product_type', { length: 20 }).notNull(),
  activityPointsPrice: integer('activity_points_price').notNull(),
  donationPointsPrice: integer('donation_points_price').notNull(),
  allowedPointTypes: varchar('allowed_point_types', { length: 20 }).array().default(['activity', 'donation']),
  stock: integer('stock').default(-1),
  stockRemaining: integer('stock_remaining').default(-1),
  isFeatured: boolean('is_featured').default(false),
  sortOrder: integer('sort_order').default(0),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const mallProductsRelations = relations(mallProducts, ({ many }) => ({
  orderItems: many(() => require('./mall-order-items').mallOrderItems),
}))
