import { real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const costs = sqliteTable('costs', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  netAmount: real('net_amount').notNull(),
  vatRate: real('vat_rate').notNull(),
  category: text('category').notNull(),
});
