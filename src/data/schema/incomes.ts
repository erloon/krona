import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const incomes = sqliteTable('incomes', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  billingType: text('billing_type').notNull(),
  baseAmount: real('base_amount').notNull(),
  currency: text('currency').notNull(),
  vatRate: text('vat_rate').notNull(),
  workingDaysPerMonth: integer('working_days_per_month').notNull(),
  workingHoursPerDay: integer('working_hours_per_day').notNull(),
  exchangeRate: real('exchange_rate').notNull(),
  exchangeRateSource: text('exchange_rate_source').notNull(),
  exchangeRateEffectiveDate: text('exchange_rate_effective_date').notNull(),
});
