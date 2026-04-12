import type { Cost } from '@/features/calculator/domain/entities/cost';
import type { Income, IncomeExchangeRateSource } from '@/features/calculator/domain/entities/income';

export const MONTHLY_CALCULATION_SNAPSHOT_VERSION = 2;

export type MonthlyCalculationSnapshotFxAuditEntry = Readonly<{
  itemId: string;
  itemType: 'income' | 'cost';
  originalAmount: number;
  originalCurrency: string;
  convertedPlnAmount: number;
  exchangeRate: number;
  exchangeRateSource: IncomeExchangeRateSource;
  exchangeRateReferenceDate: string;
  exchangeRateEffectiveDate: string;
}>;

export type MonthlyCalculationSnapshotFxAudit = Readonly<{
  incomes: readonly MonthlyCalculationSnapshotFxAuditEntry[];
  costs: readonly MonthlyCalculationSnapshotFxAuditEntry[];
}>;

export type MonthlyCalculationSnapshot = Readonly<{
  reportingPeriodId: string;
  version: number;
  revenueAmount: number;
  outputVatAmount: number;
  costAmount: number;
  deductibleCostAmount: number;
  deductibleInputVatAmount: number;
  vatPayableAmount: number;
  vatSurplusAmount: number;
  pitAmount: number;
  zusAmount: number;
  healthContributionAmount: number;
  netToHandAmount: number;
  annualBasePitAmount: number;
  annualPitAfterIpBoxAmount: number;
  annualIpBoxTaxAmount: number;
  annualIpBoxTaxGainAmount: number;
  annualQualifiedIpIncomeAmount: number;
  annualQualifiedIpIncomeAfterNexusAmount: number;
  annualResidualTaxableIncomeAmount: number;
  ipBoxNexusRatio: number;
  ipBoxWarning: string | null;
  fxAudit: MonthlyCalculationSnapshotFxAudit;
  calculatedAt: string;
}>;

export function createMonthlyCalculationSnapshot(params: {
  reportingPeriodId: string;
  revenueAmount: number;
  outputVatAmount: number;
  costAmount: number;
  deductibleCostAmount: number;
  deductibleInputVatAmount: number;
  vatPayableAmount: number;
  vatSurplusAmount: number;
  pitAmount: number;
  zusAmount: number;
  healthContributionAmount: number;
  netToHandAmount: number;
  annualBasePitAmount?: number;
  annualPitAfterIpBoxAmount?: number;
  annualIpBoxTaxAmount?: number;
  annualIpBoxTaxGainAmount?: number;
  annualQualifiedIpIncomeAmount?: number;
  annualQualifiedIpIncomeAfterNexusAmount?: number;
  annualResidualTaxableIncomeAmount?: number;
  ipBoxNexusRatio?: number;
  ipBoxWarning?: string | null;
  fxAudit?: MonthlyCalculationSnapshotFxAudit;
  calculatedAt?: string;
}): MonthlyCalculationSnapshot {
  return Object.freeze({
    reportingPeriodId: params.reportingPeriodId,
    version: MONTHLY_CALCULATION_SNAPSHOT_VERSION,
    revenueAmount: params.revenueAmount,
    outputVatAmount: params.outputVatAmount,
    costAmount: params.costAmount,
    deductibleCostAmount: params.deductibleCostAmount,
    deductibleInputVatAmount: params.deductibleInputVatAmount,
    vatPayableAmount: params.vatPayableAmount,
    vatSurplusAmount: params.vatSurplusAmount,
    pitAmount: params.pitAmount,
    zusAmount: params.zusAmount,
    healthContributionAmount: params.healthContributionAmount,
    netToHandAmount: params.netToHandAmount,
    annualBasePitAmount: params.annualBasePitAmount ?? params.pitAmount * 12,
    annualPitAfterIpBoxAmount: params.annualPitAfterIpBoxAmount ?? params.pitAmount * 12,
    annualIpBoxTaxAmount: params.annualIpBoxTaxAmount ?? 0,
    annualIpBoxTaxGainAmount: params.annualIpBoxTaxGainAmount ?? 0,
    annualQualifiedIpIncomeAmount: params.annualQualifiedIpIncomeAmount ?? 0,
    annualQualifiedIpIncomeAfterNexusAmount:
      params.annualQualifiedIpIncomeAfterNexusAmount ?? 0,
    annualResidualTaxableIncomeAmount: params.annualResidualTaxableIncomeAmount ?? 0,
    ipBoxNexusRatio: params.ipBoxNexusRatio ?? 0,
    ipBoxWarning: params.ipBoxWarning ?? null,
    fxAudit:
      params.fxAudit ??
      Object.freeze({
        incomes: [],
        costs: [],
      }),
    calculatedAt: params.calculatedAt ?? new Date().toISOString(),
  });
}

export function createIncomeFxAuditEntry(
  income: Income,
  convertedPlnAmount: number
): MonthlyCalculationSnapshotFxAuditEntry {
  return Object.freeze({
    itemId: income.id,
    itemType: 'income',
    originalAmount: income.baseAmount,
    originalCurrency: income.currency,
    convertedPlnAmount,
    exchangeRate: income.exchangeRate,
    exchangeRateSource: income.exchangeRateSource,
    exchangeRateReferenceDate: income.exchangeRateReferenceDate,
    exchangeRateEffectiveDate: income.exchangeRateEffectiveDate,
  });
}

export function createCostFxAuditEntry(
  cost: Cost,
  convertedPlnAmount: number
): MonthlyCalculationSnapshotFxAuditEntry {
  return Object.freeze({
    itemId: cost.id,
    itemType: 'cost',
    originalAmount: cost.enteredNetAmount,
    originalCurrency: cost.currency,
    convertedPlnAmount,
    exchangeRate: cost.exchangeRate,
    exchangeRateSource: cost.exchangeRateSource,
    exchangeRateReferenceDate: cost.exchangeRateReferenceDate,
    exchangeRateEffectiveDate: cost.exchangeRateEffectiveDate,
  });
}
