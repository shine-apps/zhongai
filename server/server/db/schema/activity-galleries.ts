import {
  pgTable,
  uuid,
  varchar,
  bigint,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { activities } from './activities'

export const activityGalleries = pgTable('activity_galleries', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id').references(() => activities.id).notNull(),
  mediaType: varchar('media_type', { length: 10 }).notNull(),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  fileSize: bigint('file_size', { mode: 'number' }),
  width: integer('width'),
  height: integer('height'),
  duration: integer('duration'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const activityGalleriesRelations = relations(activityGalleries, ({ one }) => ({
  activity: one(activities, {
    fields: [activityGalleries.activityId],
    references: [activities.id],
  }),
}))
