import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const settingsTable = sqliteTable('settings', {
  id: text('id').primaryKey(),
  version: integer('version').notNull(),
  payload: text('payload').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const reportingPeriodsTable = sqliteTable(
  'reporting_periods',
  {
    id: text('id').primaryKey(),
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    status: text('status').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => ({
    yearMonthIndex: uniqueIndex('reporting_periods_year_month_idx').on(table.year, table.month),
  })
);

export const reportingPeriodSettingsSnapshotsTable = sqliteTable(
  'reporting_period_settings_snapshots',
  {
    reportingPeriodId: text('reporting_period_id')
      .primaryKey()
      .references(() => reportingPeriodsTable.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    payload: text('payload').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  }
);

export const monthlyCalculationSnapshotsTable = sqliteTable(
  'monthly_calculation_snapshots',
  {
    reportingPeriodId: text('reporting_period_id')
      .primaryKey()
      .references(() => reportingPeriodsTable.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    payload: text('payload').notNull(),
    calculatedAt: text('calculated_at').notNull(),
  }
);

export const incomesTable = sqliteTable(
  'incomes',
  {
    id: text('id').primaryKey(),
    reportingPeriodId: text('reporting_period_id')
      .notNull()
      .references(() => reportingPeriodsTable.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    description: text('description').notNull(),
    billingType: text('billing_type').notNull().default('MONTHLY'),
    baseAmount: real('base_amount').notNull().default(0),
    currency: text('currency').notNull(),
    vatRate: text('vat_rate').notNull(),
    workingDaysPerMonth: integer('working_days_per_month').notNull().default(21),
    workingHoursPerDay: integer('working_hours_per_day').notNull().default(8),
    exchangeRate: real('exchange_rate').notNull().default(1),
    exchangeRateSource: text('exchange_rate_source').notNull().default('STATIC'),
    exchangeRateEffectiveDate: text('exchange_rate_effective_date').notNull().default('1970-01-01'),
    lumpSumRate: text('lump_sum_rate'),
    ipBoxQualifiedIncomePercent: text('ip_box_qualified_income_percent'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    clientName: text('client_name').notNull().default(''),
    invoiceNumber: text('invoice_number').notNull().default(''),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => ({
    reportingPeriodIndex: index('incomes_reporting_period_idx').on(table.reportingPeriodId),
  })
);

export const costsTable = sqliteTable(
  'costs',
  {
    id: text('id').primaryKey(),
    reportingPeriodId: text('reporting_period_id')
      .notNull()
      .references(() => reportingPeriodsTable.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    description: text('description').notNull(),
    netAmount: real('net_amount').notNull(),
    vatRate: text('vat_rate').notNull(),
    category: text('category').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => ({
    reportingPeriodIndex: index('costs_reporting_period_idx').on(table.reportingPeriodId),
  })
);

export const schema = {
  settingsTable,
  reportingPeriodsTable,
  reportingPeriodSettingsSnapshotsTable,
  monthlyCalculationSnapshotsTable,
  incomesTable,
  costsTable,
};
