import type { Cost } from '@/features/calculator/domain/entities/cost';
import type { Income } from '@/features/calculator/domain/entities/income';
import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import {
  createMonthlyReportingPeriod,
  toMonthlyReportingPeriodLabel,
} from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';

export type IncomeListItemViewModel = {
  id: string;
  title: string;
  metadata: string;
  amount: number;
  currency: string;
  vatLabel: string;
};

export type IncomeSummaryViewModel = {
  monthLabel: string;
  totalNetAmount: number;
  vatAmount: number;
  pitAmount: number;
};

export type CostListItemViewModel = {
  id: string;
  title: string;
  metadata: string;
  amount: number;
  vatLabel: string;
  categoryLabel: string;
};

export type CostSummaryViewModel = {
  monthLabel: string;
  totalAmount: number;
  deductibleAmount: number;
  vatOffsetAmount: number;
};

export type DashboardViewModel = {
  monthLabel: string;
  statusLabel: string;
  netToHandAmount: number;
  revenueAmount: number;
  costAmount: number;
  pitAmount: number;
  vatPayableAmount: number;
  zusAmount: number;
  healthContributionAmount: number;
};

export function buildIncomeSummaryViewModel(bundle: ReportingPeriodBundle): IncomeSummaryViewModel {
  return {
    monthLabel: toBundlePeriodLabel(bundle),
    totalNetAmount: bundle.calculationSnapshot.revenueAmount,
    vatAmount: bundle.calculationSnapshot.outputVatAmount,
    pitAmount: bundle.calculationSnapshot.pitAmount,
  };
}

export function buildIncomeListItems(bundle: ReportingPeriodBundle): IncomeListItemViewModel[] {
  return bundle.incomes.map((income) => ({
    id: income.id,
    title: income.label,
    metadata: income.description || fallbackIncomeMetadata(income),
    amount: income.netAmount,
    currency: income.currency,
    vatLabel: toIncomeVatLabel(income),
  }));
}

export function buildCostSummaryViewModel(bundle: ReportingPeriodBundle): CostSummaryViewModel {
  return {
    monthLabel: toBundlePeriodLabel(bundle),
    totalAmount: bundle.calculationSnapshot.costAmount,
    deductibleAmount: bundle.calculationSnapshot.deductibleCostAmount,
    vatOffsetAmount: bundle.calculationSnapshot.deductibleInputVatAmount,
  };
}

export function buildCostListItems(bundle: ReportingPeriodBundle): CostListItemViewModel[] {
  return bundle.costs.map((cost) => ({
    id: cost.id,
    title: cost.label,
    metadata: cost.description || fallbackCostMetadata(cost),
    amount: cost.netAmount,
    vatLabel: toCostVatLabel(cost),
    categoryLabel: toCostCategoryLabel(cost),
  }));
}

export function buildDashboardViewModel(bundle: ReportingPeriodBundle): DashboardViewModel {
  return {
    monthLabel: toBundlePeriodLabel(bundle),
    statusLabel: 'Snapshot zapisany',
    netToHandAmount: bundle.calculationSnapshot.netToHandAmount,
    revenueAmount: bundle.calculationSnapshot.revenueAmount,
    costAmount: bundle.calculationSnapshot.costAmount,
    pitAmount: bundle.calculationSnapshot.pitAmount,
    vatPayableAmount: bundle.calculationSnapshot.vatPayableAmount,
    zusAmount: bundle.calculationSnapshot.zusAmount,
    healthContributionAmount: bundle.calculationSnapshot.healthContributionAmount,
  };
}

export function formatCurrencyAmount(value: number) {
  return amountFormatter.format(value);
}

function toBundlePeriodLabel(bundle: ReportingPeriodBundle) {
  return toMonthlyReportingPeriodLabel(
    createMonthlyReportingPeriod(bundle.reportingPeriod.year, bundle.reportingPeriod.month)
  );
}

function toIncomeVatLabel(income: Income) {
  return income.vatRate === 'NP' ? 'VAT NP' : `VAT ${income.vatRate}%`;
}

function toCostVatLabel(cost: Cost) {
  if (cost.vatRate === 'ZW') {
    return 'VAT ZW';
  }

  return `VAT ${cost.vatRate}%`;
}

function toCostCategoryLabel(cost: Cost) {
  switch (cost.category) {
    case 'CAR_MIXED':
      return 'Auto 50/75';
    case 'CAR_BUSINESS':
      return 'Auto firmowe';
    default:
      return 'Koszt standardowy';
  }
}

function fallbackIncomeMetadata(income: Income) {
  return income.createdAt.slice(0, 10);
}

function fallbackCostMetadata(cost: Cost) {
  return cost.createdAt.slice(0, 10);
}

const amountFormatter = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
