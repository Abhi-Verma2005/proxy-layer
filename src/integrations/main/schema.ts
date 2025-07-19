import { pgTable, serial, text, timestamp, boolean, integer, jsonb, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Generated schema for main
// Generated at: 2025-07-18T13:26:42.656Z
// Tables found: _prisma_migrations, esop_faq, permissions, role_permissions, roles, user, user_permissions

export const _prisma_migrations = pgTable('_prisma_migrations', {
  id: varchar({ length: 36 }).notNull().primaryKey(),
  checksum: varchar({ length: 64 }).notNull(),
  finished_at: timestamp({ withTimezone: true }),
  migration_name: varchar({ length: 255 }).notNull(),
  logs: text(),
  rolled_back_at: timestamp({ withTimezone: true }),
  started_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  applied_steps_count: integer().notNull().default(0),
});

export const esop_faq = pgTable('esop_faq', {
  id: integer().notNull().primaryKey(),
  question: text().notNull(),
  answer: text().notNull(),
  created_at: timestamp().notNull().default(sql`now()`),
  updated_at: timestamp().notNull(),
});

export const permissions = pgTable('permissions', {
  id: integer().notNull().primaryKey(),
  key: text().notNull(),
  description: text(),
});

export const role_permissions = pgTable('role_permissions', {
  id: integer().notNull().primaryKey(),
  role_id: integer(),
  permission_id: integer(),
});

export const roles = pgTable('roles', {
  id: integer().notNull().primaryKey(),
  name: text().notNull(),
  hierarchy_level: integer().notNull(),
  description: text(),
});

export const user = pgTable('user', {
  id: uuid().notNull().primaryKey(),
  role_id: integer(),
  manager_id: uuid(),
  name: text(),
  email: text(),
});

export const user_permissions = pgTable('user_permissions', {
  id: integer().notNull().primaryKey(),
  user_id: uuid(),
  permission_id: integer(),
  granted: boolean().notNull(),
});

