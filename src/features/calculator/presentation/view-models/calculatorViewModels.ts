import type { Cost } from '@/features/calculator/domain/entities/cost';
import { resolveIncomeMonthlyNetAmount, type Income } from '@/features/calculator/domain/entities/income';
import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import {
  createMonthlyReportingPeriod,
  toMonthlyReportingPeriodLabel,
} from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';
import {
  validateIncomeEntityBusinessRules,
  type IncomeValidationWarning,
} from '@/features/calculator/domain/services/validateIncomeBusinessRules';

export type IncomeListItemViewModel = {
  id: string;
  clientName: string;
  invoiceNumber: string;
  amount: number;
  currency: Income['currency'];
  vatRate: Income['vatRate'];
  vatLabel: string;
  billingType: Income['billingType'];
  billingTypeLabel: string;
  createdAt: string;
  searchableText: string;
  warnings: readonly IncomeValidationWarning[];
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
  amount: number;
  netAmount: number;
  vatLabel: string;
  categoryLabel: string;
  deductionLabel: string;
  searchableText: string;
  vatRate: Cost['vatRate'];
  category: Cost['category'];
  createdAt: string;
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
  return bundle.incomes.map((income) => {
    const validationResult = validateIncomeEntityBusinessRules(income);

    return {
      id: income.id,
      clientName: income.clientName || income.label,
      invoiceNumber: income.invoiceNumber || fallbackIncomeInvoiceNumber(income),
      amount: resolveIncomeMonthlyNetAmount(income),
      currency: income.currency,
      vatRate: income.vatRate,
      vatLabel: toIncomeVatLabel(income),
      billingType: income.billingType,
      billingTypeLabel: toIncomeBillingTypeLabel(income),
      createdAt: income.createdAt,
      searchableText: [
        income.label,
        income.description,
        income.clientName,
        income.invoiceNumber,
      ]
        .filter(Boolean)
        .join(' '),
      warnings: validationResult.warnings,
    };
  });
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
    amount: resolveCostGrossAmount(cost),
    netAmount: cost.netAmount,
    vatLabel: toCostVatLabel(cost),
    categoryLabel: toCostCategoryLabel(cost),
    deductionLabel: toCostDeductionLabel(cost),
    searchableText: [cost.label, cost.description, cost.category, cost.vatRate].join(' '),
    vatRate: cost.vatRate,
    category: cost.category,
    createdAt: cost.createdAt,
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
      return 'Auto mieszane';
    case 'CAR_BUSINESS':
      return 'Auto firmowe';
    default:
      return 'Standard';
  }
}

function fallbackIncomeInvoiceNumber(income: Income) {
  return `${toIncomeBillingTypeLabel(income)} · ${income.createdAt.slice(0, 10)}`;
}

function toIncomeBillingTypeLabel(income: Income) {
  switch (income.billingType) {
    case 'DAILY':
      return 'Dziennie';
    case 'HOURLY':
      return 'Godzinowo';
    default:
      return 'Miesięcznie';
  }
}

function resolveCostGrossAmount(cost: Cost) {
  return cost.netAmount + cost.netAmount * parseCostVatRate(cost.vatRate);
}

function parseCostVatRate(vatRate: Cost['vatRate']) {
  if (vatRate === 'ZW') {
    return 0;
  }

  return Number(vatRate) / 100;
}

function toCostDeductionLabel(cost: Cost) {
  switch (cost.category) {
    case 'CAR_MIXED':
      return 'Odliczenie: PIT 75% | VAT 50%';
    case 'CAR_BUSINESS':
      return 'Odliczenie: PIT 100% | VAT 100%';
    default:
      return 'Odliczenie: PIT 100% | VAT 100%';
  }
}

const amountFormatter = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
