import {
  pgTable,
  uuid,
  varchar,
  integer,
  decimal,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core'

export const pointRules = pgTable('point_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  ruleType: varchar('rule_type', { length: 30 }).notNull(),
  pointType: varchar('point_type', { length: 20 }).notNull(),
  pointsPerUnit: integer('points_per_unit').notNull(),
  unitDesc: varchar('unit_desc', { length: 50 }),
  minAmount: decimal('min_amount', { precision: 12, scale: 2 }).default('0'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})
