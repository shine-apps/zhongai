import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 100 }).notNull(),
  category: varchar('category', { length: 30 }).notNull(),
  description: text('description'),
  coverImage: varchar('cover_image', { length: 500 }),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  location: varchar('location', { length: 200 }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  checkinRadius: integer('checkin_radius').default(200),
  maxParticipants: integer('max_participants'),
  currentParticipants: integer('current_participants').default(0),
  rewardPoints: integer('reward_points').notNull(),
  status: varchar('status', { length: 20 }).default('draft'),
  organizerId: uuid('organizer_id').references(() => users.id).notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  organizer: one(users, {
    fields: [activities.organizerId],
    references: [users.id],
    relationName: 'organizedActivities',
  }),
  registrations: many(() => require('./activity-registrations').activityRegistrations),
  checkins: many(() => require('./activity-checkins').activityCheckins),
  galleries: many(() => require('./activity-galleries').activityGalleries),
}))
