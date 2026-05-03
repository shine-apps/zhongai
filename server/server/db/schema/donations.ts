import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const donations = pgTable('donations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  donationType: varchar('donation_type', { length: 20 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }),
  materialDesc: text('material_desc'),
  materialValue: decimal('material_value', { precision: 12, scale: 2 }),
  evidenceImages: jsonb('evidence_images').default([]),
  evidenceDesc: text('evidence_desc'),
  status: varchar('status', { length: 20 }).default('pending'),
  reviewerId: uuid('reviewer_id').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewRemark: varchar('review_remark', { length: 200 }),
  pointsGranted: boolean('points_granted').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const donationsRelations = relations(donations, ({ one }) => ({
  user: one(users, {
    fields: [donations.userId],
    references: [users.id],
    relationName: 'donations',
  }),
  reviewer: one(users, {
    fields: [donations.reviewerId],
    references: [users.id],
    relationName: 'donationReviewer',
  }),
}))
