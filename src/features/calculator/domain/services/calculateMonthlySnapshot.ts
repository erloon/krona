import type { Cost, CostCategory, CostVatRate } from '@/features/calculator/domain/entities/cost';
import {
  resolveIncomeMonthlyNetAmount,
  type Income,
  type IncomeVatRate,
} from '@/features/calculator/domain/entities/income';
import {
  createMonthlyCalculationSnapshot,
  type MonthlyCalculationSnapshot,
} from '@/features/calculator/domain/entities/monthly-calculation-snapshot';
import type { ReportingPeriodSettingsSnapshot } from '@/features/calculator/domain/entities/reporting-period-settings-snapshot';

const ZUS_SOCIAL_BY_STATUS: Record<ReportingPeriodSettingsSnapshot['zusStatus'], number> = {
  STANDARD: 1773.96,
  PREFERENTIAL: 442.9,
  STARTUP: 0,
  UOP: 0,
};

const VOLUNTARY_SICKNESS_AMOUNT = 136.58;
const HEALTH_FLOOR_FLAT_19 = 432.54;

export function calculateMonthlySnapshot(params: {
  reportingPeriodId: string;
  settingsSnapshot: ReportingPeriodSettingsSnapshot;
  incomes: readonly Income[];
  costs: readonly Cost[];
  calculatedAt?: string;
}): MonthlyCalculationSnapshot {
  const revenueAmount = roundMoney(
    params.incomes.reduce((sum, income) => sum + resolveIncomeMonthlyNetAmount(income), 0)
  );
  const outputVatAmount = roundMoney(
    params.incomes.reduce(
      (sum, income) =>
        sum + calculateIncomeVat(resolveIncomeMonthlyNetAmount(income), income.vatRate),
      0
    )
  );

  const derivedCosts = params.costs.map((cost) => deriveCostAmounts(cost, params.settingsSnapshot.vatStatus));
  const costAmount = roundMoney(derivedCosts.reduce((sum, cost) => sum + cost.economicCostAmount, 0));
  const deductibleCostAmount =
    params.settingsSnapshot.taxationForm === 'LUMP_SUM'
      ? 0
      : roundMoney(derivedCosts.reduce((sum, cost) => sum + cost.deductibleCostAmount, 0));
  const deductibleInputVatAmount = roundMoney(
    derivedCosts.reduce((sum, cost) => sum + cost.deductibleInputVatAmount, 0)
  );

  const zusAmount = roundMoney(
    ZUS_SOCIAL_BY_STATUS[params.settingsSnapshot.zusStatus] +
      (params.settingsSnapshot.voluntarySicknessInsurance ? VOLUNTARY_SICKNESS_AMOUNT : 0)
  );
  const taxableBase = Math.max(0, revenueAmount - deductibleCostAmount - zusAmount);
  const healthContributionAmount = roundMoney(
    calculateHealthContribution(params.settingsSnapshot, revenueAmount, taxableBase)
  );
  const pitAmount = roundMoney(
    calculatePitAmount(params.settingsSnapshot, revenueAmount, deductibleCostAmount, zusAmount)
  );
  const vatPayableAmount = roundMoney(Math.max(0, outputVatAmount - deductibleInputVatAmount));
  const vatSurplusAmount = roundMoney(Math.max(0, deductibleInputVatAmount - outputVatAmount));
  // Revenue is already stored as the net invoice base, so output VAT stays a separate
  // settlement metric and must not be deducted again from the take-home result.
  const netToHandAmount = roundMoney(
    revenueAmount - costAmount - zusAmount - healthContributionAmount - pitAmount
  );

  return createMonthlyCalculationSnapshot({
    reportingPeriodId: params.reportingPeriodId,
    revenueAmount,
    outputVatAmount,
    costAmount,
    deductibleCostAmount,
    deductibleInputVatAmount,
    vatPayableAmount,
    vatSurplusAmount,
    pitAmount,
    zusAmount,
    healthContributionAmount,
    netToHandAmount,
    calculatedAt: params.calculatedAt,
  });
}

function calculatePitAmount(
  settingsSnapshot: ReportingPeriodSettingsSnapshot,
  revenueAmount: number,
  deductibleCostAmount: number,
  zusAmount: number
): number {
  if (settingsSnapshot.taxationForm === 'LUMP_SUM') {
    return revenueAmount * (Number(settingsSnapshot.lumpSumRate.replace('_', '.')) / 100);
  }

  const taxableBase = Math.max(0, revenueAmount - deductibleCostAmount - zusAmount);

  if (settingsSnapshot.taxationForm === 'FLAT_19') {
    return taxableBase * 0.19;
  }

  return Math.max(0, taxableBase * 0.12 - 300);
}

function calculateHealthContribution(
  settingsSnapshot: ReportingPeriodSettingsSnapshot,
  revenueAmount: number,
  taxableBase: number
): number {
  if (settingsSnapshot.taxationForm === 'LUMP_SUM') {
    const annualizedRevenue = revenueAmount * 12;

    if (annualizedRevenue > 300000) {
      return 1495.04;
    }

    if (annualizedRevenue > 60000) {
      return 830.58;
    }

    return 498.35;
  }

  if (settingsSnapshot.taxationForm === 'FLAT_19') {
    return Math.max(HEALTH_FLOOR_FLAT_19, taxableBase * 0.049);
  }

  return taxableBase * 0.09;
}

function deriveCostAmounts(cost: Cost, vatStatus: ReportingPeriodSettingsSnapshot['vatStatus']) {
  const vatAmount = calculateCostVat(cost.netAmount, cost.vatRate);
  const deductibleInputVatShare = getDeductibleVatShare(cost.category, vatStatus);
  const deductibleInputVatAmount = roundMoney(vatAmount * deductibleInputVatShare);
  const nonDeductibleVatAmount = roundMoney(vatAmount - deductibleInputVatAmount);
  const deductibleCostShare = getDeductibleCostShare(cost.category);
  const deductibleCostAmount = roundMoney((cost.netAmount + nonDeductibleVatAmount) * deductibleCostShare);
  const economicCostAmount = roundMoney(cost.netAmount + nonDeductibleVatAmount);

  return {
    deductibleInputVatAmount,
    deductibleCostAmount,
    economicCostAmount,
  };
}

function getDeductibleVatShare(
  category: CostCategory,
  vatStatus: ReportingPeriodSettingsSnapshot['vatStatus']
): number {
  if (vatStatus !== 'ACTIVE') {
    return 0;
  }

  if (category === 'CAR_MIXED') {
    return 0.5;
  }

  return 1;
}

function getDeductibleCostShare(category: CostCategory): number {
  if (category === 'CAR_MIXED') {
    return 0.75;
  }

  return 1;
}

function calculateIncomeVat(amount: number, vatRate: IncomeVatRate): number {
  return amount * parseVatRate(vatRate);
}

function calculateCostVat(amount: number, vatRate: CostVatRate): number {
  return amount * parseVatRate(vatRate);
}

function parseVatRate(vatRate: IncomeVatRate | CostVatRate): number {
  if (vatRate === 'NP' || vatRate === 'ZW') {
    return 0;
  }

  return Number(vatRate) / 100;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
