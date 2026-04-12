export const MONTHLY_CALCULATION_SNAPSHOT_VERSION = 1;

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
    calculatedAt: params.calculatedAt ?? new Date().toISOString(),
  });
}
