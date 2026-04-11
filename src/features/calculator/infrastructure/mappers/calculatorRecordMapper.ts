import type {
  costsTable,
  incomesTable,
  monthlyCalculationSnapshotsTable,
  reportingPeriodsTable,
  reportingPeriodSettingsSnapshotsTable,
} from '@/core/database/schema';
import { createCost, type Cost } from '@/features/calculator/domain/entities/cost';
import { createIncome, type Income } from '@/features/calculator/domain/entities/income';
import {
  createMonthlyCalculationSnapshot,
  MONTHLY_CALCULATION_SNAPSHOT_VERSION,
  type MonthlyCalculationSnapshot,
} from '@/features/calculator/domain/entities/monthly-calculation-snapshot';
import {
  createReportingPeriod,
  REPORTING_PERIOD_STATUS,
  type ReportingPeriod,
} from '@/features/calculator/domain/entities/reporting-period';
import {
  createReportingPeriodSettingsSnapshot,
  REPORTING_PERIOD_SETTINGS_SNAPSHOT_VERSION,
  type ReportingPeriodSettingsSnapshot,
} from '@/features/calculator/domain/entities/reporting-period-settings-snapshot';

type ReportingPeriodRecord = typeof reportingPeriodsTable.$inferSelect;
type ReportingPeriodInsertRecord = typeof reportingPeriodsTable.$inferInsert;
type ReportingPeriodSettingsSnapshotRecord = typeof reportingPeriodSettingsSnapshotsTable.$inferSelect;
type ReportingPeriodSettingsSnapshotInsertRecord =
  typeof reportingPeriodSettingsSnapshotsTable.$inferInsert;
type MonthlyCalculationSnapshotRecord = typeof monthlyCalculationSnapshotsTable.$inferSelect;
type MonthlyCalculationSnapshotInsertRecord = typeof monthlyCalculationSnapshotsTable.$inferInsert;
type IncomeRecord = typeof incomesTable.$inferSelect;
type IncomeInsertRecord = typeof incomesTable.$inferInsert;
type CostRecord = typeof costsTable.$inferSelect;
type CostInsertRecord = typeof costsTable.$inferInsert;

type ReportingPeriodSettingsSnapshotPayload = Omit<
  ReportingPeriodSettingsSnapshot,
  'reportingPeriodId' | 'version' | 'createdAt' | 'updatedAt'
>;

type MonthlyCalculationSnapshotPayload = Omit<
  MonthlyCalculationSnapshot,
  'reportingPeriodId' | 'version' | 'calculatedAt'
>;

export function toReportingPeriodRecord(
  reportingPeriod: ReportingPeriod
): ReportingPeriodInsertRecord {
  return {
    id: reportingPeriod.id,
    year: reportingPeriod.year,
    month: reportingPeriod.month,
    status: reportingPeriod.status,
    createdAt: reportingPeriod.createdAt,
    updatedAt: reportingPeriod.updatedAt,
  };
}

export function fromReportingPeriodRecord(record: ReportingPeriodRecord): ReportingPeriod {
  return createReportingPeriod({
    id: record.id,
    year: record.year,
    month: record.month,
    status: record.status as ReportingPeriod['status'],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export function toReportingPeriodSettingsSnapshotRecord(
  snapshot: ReportingPeriodSettingsSnapshot
): ReportingPeriodSettingsSnapshotInsertRecord {
  const payload: ReportingPeriodSettingsSnapshotPayload = {
    taxYear: snapshot.taxYear,
    taxationForm: snapshot.taxationForm,
    lumpSumRate: snapshot.lumpSumRate,
    jointTaxation: snapshot.jointTaxation,
    jointTaxationSpouseAnnualIncome: snapshot.jointTaxationSpouseAnnualIncome,
    zusStatus: snapshot.zusStatus,
    voluntarySicknessInsurance: snapshot.voluntarySicknessInsurance,
    vatStatus: snapshot.vatStatus,
    ipBox: snapshot.ipBox,
    ipBoxQualifiedIncomePercent: snapshot.ipBoxQualifiedIncomePercent,
    ipBoxCostsA: snapshot.ipBoxCostsA,
    ipBoxCostsB: snapshot.ipBoxCostsB,
    ipBoxCostsC: snapshot.ipBoxCostsC,
    ipBoxCostsD: snapshot.ipBoxCostsD,
    returnRelief: snapshot.returnRelief,
    familyRelief: snapshot.familyRelief,
  };

  return {
    reportingPeriodId: snapshot.reportingPeriodId,
    version: REPORTING_PERIOD_SETTINGS_SNAPSHOT_VERSION,
    payload: JSON.stringify(payload),
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
  };
}

export function fromReportingPeriodSettingsSnapshotRecord(
  record: ReportingPeriodSettingsSnapshotRecord
): ReportingPeriodSettingsSnapshot {
  const parsed = JSON.parse(record.payload) as Partial<ReportingPeriodSettingsSnapshotPayload>;

  return createReportingPeriodSettingsSnapshot({
    reportingPeriodId: record.reportingPeriodId,
    taxYear: parsed.taxYear ?? new Date().getUTCFullYear(),
    taxationForm: parsed.taxationForm ?? 'FLAT_19',
    lumpSumRate: parsed.lumpSumRate ?? '12',
    jointTaxation: parsed.jointTaxation ?? false,
    jointTaxationSpouseAnnualIncome: parsed.jointTaxationSpouseAnnualIncome ?? '0',
    zusStatus: parsed.zusStatus ?? 'PREFERENTIAL',
    voluntarySicknessInsurance: parsed.voluntarySicknessInsurance ?? false,
    vatStatus: parsed.vatStatus ?? 'ACTIVE',
    ipBox: parsed.ipBox ?? false,
    ipBoxQualifiedIncomePercent: parsed.ipBoxQualifiedIncomePercent ?? '100',
    ipBoxCostsA: parsed.ipBoxCostsA ?? '0',
    ipBoxCostsB: parsed.ipBoxCostsB ?? '0',
    ipBoxCostsC: parsed.ipBoxCostsC ?? '0',
    ipBoxCostsD: parsed.ipBoxCostsD ?? '0',
    returnRelief: parsed.returnRelief ?? false,
    familyRelief: parsed.familyRelief ?? false,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export function toMonthlyCalculationSnapshotRecord(
  snapshot: MonthlyCalculationSnapshot
): MonthlyCalculationSnapshotInsertRecord {
  const payload: MonthlyCalculationSnapshotPayload = {
    revenueAmount: snapshot.revenueAmount,
    outputVatAmount: snapshot.outputVatAmount,
    costAmount: snapshot.costAmount,
    deductibleCostAmount: snapshot.deductibleCostAmount,
    deductibleInputVatAmount: snapshot.deductibleInputVatAmount,
    vatPayableAmount: snapshot.vatPayableAmount,
    vatSurplusAmount: snapshot.vatSurplusAmount,
    pitAmount: snapshot.pitAmount,
    zusAmount: snapshot.zusAmount,
    healthContributionAmount: snapshot.healthContributionAmount,
    netToHandAmount: snapshot.netToHandAmount,
  };

  return {
    reportingPeriodId: snapshot.reportingPeriodId,
    version: MONTHLY_CALCULATION_SNAPSHOT_VERSION,
    payload: JSON.stringify(payload),
    calculatedAt: snapshot.calculatedAt,
  };
}

export function fromMonthlyCalculationSnapshotRecord(
  record: MonthlyCalculationSnapshotRecord
): MonthlyCalculationSnapshot {
  const parsed = JSON.parse(record.payload) as Partial<MonthlyCalculationSnapshotPayload>;

  return createMonthlyCalculationSnapshot({
    reportingPeriodId: record.reportingPeriodId,
    revenueAmount: parsed.revenueAmount ?? 0,
    outputVatAmount: parsed.outputVatAmount ?? 0,
    costAmount: parsed.costAmount ?? 0,
    deductibleCostAmount: parsed.deductibleCostAmount ?? 0,
    deductibleInputVatAmount: parsed.deductibleInputVatAmount ?? 0,
    vatPayableAmount: parsed.vatPayableAmount ?? 0,
    vatSurplusAmount: parsed.vatSurplusAmount ?? 0,
    pitAmount: parsed.pitAmount ?? 0,
    zusAmount: parsed.zusAmount ?? 0,
    healthContributionAmount: parsed.healthContributionAmount ?? 0,
    netToHandAmount: parsed.netToHandAmount ?? 0,
    calculatedAt: record.calculatedAt,
  });
}

export function toIncomeRecord(income: Income): IncomeInsertRecord {
  return {
    id: income.id,
    reportingPeriodId: income.reportingPeriodId,
    label: income.label,
    description: income.description,
    netAmount: income.netAmount,
    currency: income.currency,
    vatRate: income.vatRate,
    createdAt: income.createdAt,
    updatedAt: income.updatedAt,
  };
}

export function fromIncomeRecord(record: IncomeRecord): Income {
  return createIncome({
    id: record.id,
    reportingPeriodId: record.reportingPeriodId,
    label: record.label,
    description: record.description,
    netAmount: record.netAmount,
    currency: record.currency as Income['currency'],
    vatRate: record.vatRate as Income['vatRate'],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export function toCostRecord(cost: Cost): CostInsertRecord {
  return {
    id: cost.id,
    reportingPeriodId: cost.reportingPeriodId,
    label: cost.label,
    description: cost.description,
    netAmount: cost.netAmount,
    vatRate: cost.vatRate,
    category: cost.category,
    createdAt: cost.createdAt,
    updatedAt: cost.updatedAt,
  };
}

export function fromCostRecord(record: CostRecord): Cost {
  return createCost({
    id: record.id,
    reportingPeriodId: record.reportingPeriodId,
    label: record.label,
    description: record.description,
    netAmount: record.netAmount,
    vatRate: record.vatRate as Cost['vatRate'],
    category: record.category as Cost['category'],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export function createReportingPeriodId(year: number, month: number): string {
  return `reporting-period-${year}-${String(month).padStart(2, '0')}`;
}

export function createDefaultEmptyCalculationSnapshot(
  reportingPeriodId: string
): MonthlyCalculationSnapshot {
  return createMonthlyCalculationSnapshot({
    reportingPeriodId,
    revenueAmount: 0,
    outputVatAmount: 0,
    costAmount: 0,
    deductibleCostAmount: 0,
    deductibleInputVatAmount: 0,
    vatPayableAmount: 0,
    vatSurplusAmount: 0,
    pitAmount: 0,
    zusAmount: 0,
    healthContributionAmount: 0,
    netToHandAmount: 0,
  });
}

export function createDefaultReportingPeriodRecord(params: {
  id: string;
  year: number;
  month: number;
  now?: string;
}): ReportingPeriod {
  return createReportingPeriod({
    id: params.id,
    year: params.year,
    month: params.month,
    status: REPORTING_PERIOD_STATUS.open,
    createdAt: params.now,
    updatedAt: params.now,
  });
}
