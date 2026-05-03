import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { activities } from './activities'

export const activityRegistrations = pgTable(
  'activity_registrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    activityId: uuid('activity_id').references(() => activities.id).notNull(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    status: varchar('status', { length: 20 }).default('pending'),
    remark: varchar('remark', { length: 200 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_activity_user').on(table.activityId, table.userId),
  ],
)

export const activityRegistrationsRelations = relations(
  activityRegistrations,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityRegistrations.activityId],
      references: [activities.id],
    }),
    user: one(users, {
      fields: [activityRegistrations.userId],
      references: [users.id],
      relationName: 'activityRegistrations',
    }),
  }),
)
