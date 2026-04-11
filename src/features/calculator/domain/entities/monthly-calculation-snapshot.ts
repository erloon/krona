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
    calculatedAt: params.calculatedAt ?? new Date().toISOString(),
  });
}
