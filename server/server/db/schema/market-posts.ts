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
import { users } from './users'

export const marketPosts = pgTable('market_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  postType: varchar('post_type', { length: 20 }).notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  content: text('content').notNull(),
  images: jsonb('images').default([]),
  contactInfo: varchar('contact_info', { length: 200 }),
  pointsCost: integer('points_cost').notNull(),
  pointTypeUsed: varchar('point_type_used', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  reviewerId: uuid('reviewer_id').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const marketPostsRelations = relations(marketPosts, ({ one }) => ({
  user: one(users, {
    fields: [marketPosts.userId],
    references: [users.id],
    relationName: 'marketPosts',
  }),
  reviewer: one(users, {
    fields: [marketPosts.reviewerId],
    references: [users.id],
    relationName: 'marketPostReviewer',
  }),
}))
