import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const taxSettings = sqliteTable('tax_settings', {
  id: integer('id').primaryKey(),
  taxationForm: text('taxation_form').notNull(),
  lumpSumRate: real('lump_sum_rate').notNull(),
  zusStatus: text('zus_status').notNull(),
  voluntarySicknessInsurance: integer('voluntary_sickness_insurance', { mode: 'boolean' }).notNull(),
  unpaidHolidayDays: integer('unpaid_holiday_days').notNull(),
  vatStatus: text('vat_status').notNull(),
  taxYear: integer('tax_year').notNull(),
  ipBox: integer('ip_box', { mode: 'boolean' }).notNull(),
  ipBoxQualifiedIncomePercent: real('ip_box_qualified_income_percent').notNull(),
  ipBoxCostsA: real('ip_box_costs_a').notNull(),
  ipBoxCostsB: real('ip_box_costs_b').notNull(),
  ipBoxCostsC: real('ip_box_costs_c').notNull(),
  ipBoxCostsD: real('ip_box_costs_d').notNull(),
  returnRelief: integer('return_relief', { mode: 'boolean' }).notNull(),
  familyRelief: integer('family_relief', { mode: 'boolean' }).notNull(),
  jointTaxation: integer('joint_taxation', { mode: 'boolean' }).notNull(),
  jointTaxationSpouseAnnualIncome: real('joint_taxation_spouse_annual_income').notNull(),
});
