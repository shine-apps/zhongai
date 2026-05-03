import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const pointTransactions = pgTable('point_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  pointType: varchar('point_type', { length: 20 }).notNull(),
  changeType: varchar('change_type', { length: 20 }).notNull(),
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  sourceType: varchar('source_type', { length: 30 }).notNull(),
  sourceId: uuid('source_id'),
  description: varchar('description', { length: 200 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  user: one(users, {
    fields: [pointTransactions.userId],
    references: [users.id],
  }),
}))
