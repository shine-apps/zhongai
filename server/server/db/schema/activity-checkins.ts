import {
  pgTable,
  uuid,
  varchar,
  decimal,
  boolean,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { activities } from './activities'

export const activityCheckins = pgTable(
  'activity_checkins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    activityId: uuid('activity_id').references(() => activities.id).notNull(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    checkinType: varchar('checkin_type', { length: 20 }).notNull(),
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),
    checkinTime: timestamp('checkin_time', { withTimezone: true }).defaultNow(),
    verified: boolean('verified').default(false),
    verifiedBy: uuid('verified_by').references(() => users.id),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    pointsGranted: boolean('points_granted').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_activity_user_checkin').on(table.activityId, table.userId),
  ],
)

export const activityCheckinsRelations = relations(activityCheckins, ({ one }) => ({
  activity: one(activities, {
    fields: [activityCheckins.activityId],
    references: [activities.id],
  }),
  user: one(users, {
    fields: [activityCheckins.userId],
    references: [users.id],
    relationName: 'activityCheckins',
  }),
  verifier: one(users, {
    fields: [activityCheckins.verifiedBy],
    references: [users.id],
    relationName: 'verifierCheckins',
  }),
}))
