import type { Cost, CostCategory, CostVatRate } from '@/features/calculator/domain/entities/cost';
import {
  resolveIncomeMonthlyNetAmount,
  type Income,
  type IncomeVatRate,
} from '@/features/calculator/domain/entities/income';
import {
  createCostFxAuditEntry,
  createIncomeFxAuditEntry,
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
const IP_BOX_RATE = 0.05;
const SCALE_THRESHOLD = 120000;
const SCALE_REDUCING_AMOUNT = 3600;

export function calculateMonthlySnapshot(params: {
  reportingPeriodId: string;
  settingsSnapshot: ReportingPeriodSettingsSnapshot;
  incomes: readonly Income[];
  costs: readonly Cost[];
  calculatedAt?: string;
}): MonthlyCalculationSnapshot {
  const incomeAudit = params.incomes.map((income) =>
    createIncomeFxAuditEntry(income, resolveIncomeMonthlyNetAmount(income))
  );
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
  const costAudit = params.costs.map((cost) => createCostFxAuditEntry(cost, cost.netAmount));
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
  const ipBoxEstimate = calculateAnnualIpBoxEstimate({
    settingsSnapshot: params.settingsSnapshot,
    revenueAmount,
    deductibleCostAmount,
    zusAmount,
    baseMonthlyPitAmount: pitAmount,
  });
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
    annualBasePitAmount: ipBoxEstimate.annualBasePitAmount,
    annualPitAfterIpBoxAmount: ipBoxEstimate.annualPitAfterIpBoxAmount,
    annualIpBoxTaxAmount: ipBoxEstimate.annualIpBoxTaxAmount,
    annualIpBoxTaxGainAmount: ipBoxEstimate.annualIpBoxTaxGainAmount,
    annualQualifiedIpIncomeAmount: ipBoxEstimate.annualQualifiedIpIncomeAmount,
    annualQualifiedIpIncomeAfterNexusAmount:
      ipBoxEstimate.annualQualifiedIpIncomeAfterNexusAmount,
    annualResidualTaxableIncomeAmount: ipBoxEstimate.annualResidualTaxableIncomeAmount,
    ipBoxNexusRatio: ipBoxEstimate.ipBoxNexusRatio,
    ipBoxWarning: ipBoxEstimate.ipBoxWarning,
    fxAudit: {
      incomes: incomeAudit,
      costs: costAudit,
    },
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

function calculateAnnualIpBoxEstimate(params: {
  settingsSnapshot: ReportingPeriodSettingsSnapshot;
  revenueAmount: number;
  deductibleCostAmount: number;
  zusAmount: number;
  baseMonthlyPitAmount: number;
}) {
  const annualTaxableBase = roundMoney(
    Math.max(0, params.revenueAmount - params.deductibleCostAmount - params.zusAmount) * 12
  );
  const annualBasePitAmount = roundMoney(
    calculateAnnualStandardPit(params.settingsSnapshot.taxationForm, annualTaxableBase)
  );

  if (
    !params.settingsSnapshot.ipBox ||
    params.settingsSnapshot.taxationForm === 'LUMP_SUM'
  ) {
    return {
      annualBasePitAmount,
      annualPitAfterIpBoxAmount: annualBasePitAmount,
      annualIpBoxTaxAmount: 0,
      annualIpBoxTaxGainAmount: 0,
      annualQualifiedIpIncomeAmount: 0,
      annualQualifiedIpIncomeAfterNexusAmount: 0,
      annualResidualTaxableIncomeAmount: annualTaxableBase,
      ipBoxNexusRatio: 0,
      ipBoxWarning: null as string | null,
    };
  }

  const qualifiedIncomeShare = parsePercentInput(
    params.settingsSnapshot.ipBoxQualifiedIncomePercent
  );
  const annualRevenue = roundMoney(params.revenueAmount * 12);
  const annualDeductibleCosts = roundMoney(params.deductibleCostAmount * 12);
  const annualQualifiedRevenue = roundMoney(annualRevenue * qualifiedIncomeShare);
  const annualAttributedCosts = roundMoney(annualDeductibleCosts * qualifiedIncomeShare);
  const annualQualifiedIpIncomeAmount = roundMoney(
    Math.max(0, annualQualifiedRevenue - annualAttributedCosts)
  );

  const costA = parseMoneyInput(params.settingsSnapshot.ipBoxCostsA);
  const costB = parseMoneyInput(params.settingsSnapshot.ipBoxCostsB);
  const costC = parseMoneyInput(params.settingsSnapshot.ipBoxCostsC);
  const costD = parseMoneyInput(params.settingsSnapshot.ipBoxCostsD);
  const nexusDenominator = costA + costB + costC + costD;

  if (qualifiedIncomeShare > 0 && nexusDenominator <= 0) {
    return {
      annualBasePitAmount,
      annualPitAfterIpBoxAmount: annualBasePitAmount,
      annualIpBoxTaxAmount: 0,
      annualIpBoxTaxGainAmount: 0,
      annualQualifiedIpIncomeAmount,
      annualQualifiedIpIncomeAfterNexusAmount: 0,
      annualResidualTaxableIncomeAmount: annualTaxableBase,
      ipBoxNexusRatio: 0,
      ipBoxWarning:
        'IP Box wymaga kosztów kwalifikowanych A-D. Przy zerowych kosztach ulga nie została zastosowana.',
    };
  }

  const rawNexusRatio = nexusDenominator > 0 ? ((costA + costB) * 1.3) / nexusDenominator : 0;
  const ipBoxNexusRatio = clampRatio(rawNexusRatio);
  const annualQualifiedIpIncomeAfterNexusAmount = roundMoney(
    Math.min(annualTaxableBase, annualQualifiedIpIncomeAmount * ipBoxNexusRatio)
  );
  const annualResidualTaxableIncomeAmount = roundMoney(
    Math.max(0, annualTaxableBase - annualQualifiedIpIncomeAfterNexusAmount)
  );
  const annualIpBoxTaxAmount = roundMoney(
    annualQualifiedIpIncomeAfterNexusAmount * IP_BOX_RATE
  );
  const annualResidualPitAmount = roundMoney(
    calculateAnnualStandardPit(
      params.settingsSnapshot.taxationForm,
      annualResidualTaxableIncomeAmount
    )
  );
  const annualPitAfterIpBoxAmount = roundMoney(
    annualIpBoxTaxAmount + annualResidualPitAmount
  );

  return {
    annualBasePitAmount,
    annualPitAfterIpBoxAmount,
    annualIpBoxTaxAmount,
    annualIpBoxTaxGainAmount: roundMoney(
      Math.max(0, annualBasePitAmount - annualPitAfterIpBoxAmount)
    ),
    annualQualifiedIpIncomeAmount,
    annualQualifiedIpIncomeAfterNexusAmount,
    annualResidualTaxableIncomeAmount,
    ipBoxNexusRatio,
    ipBoxWarning: null as string | null,
  };
}

function calculateAnnualStandardPit(
  taxationForm: ReportingPeriodSettingsSnapshot['taxationForm'],
  annualTaxableBase: number
) {
  if (taxationForm === 'FLAT_19') {
    return annualTaxableBase * 0.19;
  }

  if (taxationForm === 'LUMP_SUM') {
    return annualTaxableBase;
  }

  if (annualTaxableBase <= SCALE_THRESHOLD) {
    return Math.max(0, annualTaxableBase * 0.12 - SCALE_REDUCING_AMOUNT);
  }

  return (SCALE_THRESHOLD * 0.12 - SCALE_REDUCING_AMOUNT) +
    (annualTaxableBase - SCALE_THRESHOLD) * 0.32;
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

function parsePercentInput(value: string): number {
  const parsed = Number(value.replace(',', '.'));

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.min(1, parsed / 100));
}

function parseMoneyInput(value: string): number {
  const parsed = Number(value.replace(',', '.'));

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, parsed);
}

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}
