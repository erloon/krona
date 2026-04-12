import type { Cost } from '@/features/calculator/domain/entities/cost';
import { calculateMonthlySnapshot } from '@/features/calculator/domain/services/calculateMonthlySnapshot';
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
  originalAmount: number;
  vatRate: Income['vatRate'];
  vatLabel: string;
  fxLabel?: string | null;
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
  enteredNetAmount?: number;
  enteredCurrency?: Cost['currency'];
  vatLabel: string;
  categoryLabel: string;
  deductionLabel: string;
  fxLabel?: string | null;
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
  pitReductionAmount: number;
};

export type DashboardViewModel = {
  monthLabel: string;
  statusLabel: string;
  welcomeTitle: string;
  welcomeDescription: string;
  profileInitials: string;
  hero: {
    eyebrow: string;
    amount: number;
    currency: 'PLN';
  };
  revenueCard: {
    label: string;
    amount: number;
    currency: 'PLN';
    route: '/incomes';
  };
  costCard: {
    label: string;
    amount: number;
    currency: 'PLN';
    route: '/costs';
  };
  burden: {
    title: string;
    detailLabel: string;
    amount: number;
    ratio: number;
    percentageLabel: string;
  };
  vatInfo: {
    label: string;
    amount: number;
    currency: 'PLN';
  };
  breakdown: {
    title: string;
    summaryLabel: string;
    summaryAmount: number;
    rows: readonly {
      key: 'pit' | 'zus' | 'health';
      label: string;
      amount: number;
    }[];
  };
  costSavings: {
    title: string;
    summaryLabel: string;
    summaryAmount: number;
    rows: readonly {
      key: 'pitSavings' | 'vatSavings';
      label: string;
      amount: number;
    }[];
  };
  ipBoxEstimate: null | {
    title: string;
    caption: string;
    warning: string | null;
    rows: readonly {
      key:
        | 'basePit'
        | 'pitAfter'
        | 'taxGain'
        | 'qualifiedIncome'
        | 'qualifiedAfterNexus'
        | 'nexus';
      label: string;
      value: string;
      unit?: 'PLN' | '%';
    }[];
  };
  thresholdContext: {
    title: string;
    detail: string;
  };
  actions: {
    primaryLabel: string;
    primaryRoute: '/add-income';
    secondaryLabel: string;
    secondaryRoute: '/add-cost';
  };
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
      currency: 'PLN',
      originalAmount: income.baseAmount,
      vatRate: income.vatRate,
      vatLabel: toIncomeVatLabel(income),
      fxLabel: toIncomeFxLabel(income),
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
  const snapshotWithoutCosts = calculateMonthlySnapshot({
    reportingPeriodId: bundle.reportingPeriod.id,
    settingsSnapshot: bundle.settingsSnapshot,
    incomes: bundle.incomes,
    costs: [],
  });

  return {
    monthLabel: toBundlePeriodLabel(bundle),
    totalAmount: bundle.calculationSnapshot.costAmount,
    deductibleAmount: bundle.calculationSnapshot.deductibleCostAmount,
    vatOffsetAmount: bundle.calculationSnapshot.deductibleInputVatAmount,
    pitReductionAmount: Math.max(
      0,
      roundMoney(snapshotWithoutCosts.pitAmount - bundle.calculationSnapshot.pitAmount)
    ),
  };
}

export function buildCostListItems(bundle: ReportingPeriodBundle): CostListItemViewModel[] {
  return bundle.costs.map((cost) => ({
    id: cost.id,
    title: cost.label,
    amount: resolveCostGrossAmount(cost),
    netAmount: cost.netAmount,
    enteredNetAmount: cost.enteredNetAmount,
    enteredCurrency: cost.currency,
    vatLabel: toCostVatLabel(cost),
    categoryLabel: toCostCategoryLabel(cost),
    deductionLabel: toCostDeductionLabel(cost),
    fxLabel: toCostFxLabel(cost),
    searchableText: [cost.label, cost.description, cost.category, cost.vatRate, cost.currency].join(' '),
    vatRate: cost.vatRate,
    category: cost.category,
    createdAt: cost.createdAt,
  }));
}

export function buildDashboardViewModel(bundle: ReportingPeriodBundle): DashboardViewModel {
  const snapshotWithoutCosts = calculateMonthlySnapshot({
    reportingPeriodId: bundle.reportingPeriod.id,
    settingsSnapshot: bundle.settingsSnapshot,
    incomes: bundle.incomes,
    costs: [],
  });
  const pitSavingsAmount = Math.max(
    0,
    roundMoney(snapshotWithoutCosts.pitAmount - bundle.calculationSnapshot.pitAmount)
  );
  const vatSavingsAmount = bundle.calculationSnapshot.deductibleInputVatAmount;
  const burdenAmount = roundMoney(
    bundle.calculationSnapshot.pitAmount +
      bundle.calculationSnapshot.zusAmount +
      bundle.calculationSnapshot.healthContributionAmount
  );
  const burdenRatio =
    bundle.calculationSnapshot.revenueAmount > 0
      ? clampRatio(burdenAmount / bundle.calculationSnapshot.revenueAmount)
      : 0;

  return {
    monthLabel: toBundlePeriodLabel(bundle),
    statusLabel: formatSnapshotStatusLabel(bundle.calculationSnapshot.calculatedAt),
    welcomeTitle: 'Dzień dobry',
    welcomeDescription: `Oto Twój bilans dla okresu ${toBundlePeriodLabel(bundle)}.`,
    profileInitials: 'MK',
    hero: {
      eyebrow: `Na rękę · ${toBundlePeriodLabel(bundle)}`,
      amount: bundle.calculationSnapshot.netToHandAmount,
      currency: 'PLN',
    },
    revenueCard: {
      label: 'Przychody',
      amount: bundle.calculationSnapshot.revenueAmount,
      currency: 'PLN',
      route: '/incomes',
    },
    costCard: {
      label: 'Koszty',
      amount: bundle.calculationSnapshot.costAmount,
      currency: 'PLN',
      route: '/costs',
    },
    burden: {
      title: 'Obciążenia przedsiębiorcy',
      detailLabel: formatCurrencyAmount(burdenAmount),
      amount: burdenAmount,
      ratio: burdenRatio,
      percentageLabel: `${formatPercentage(burdenRatio)} przychodu`,
    },
    vatInfo:
      bundle.calculationSnapshot.vatSurplusAmount > 0
        ? {
            label: 'Nadwyżka VAT',
            amount: bundle.calculationSnapshot.vatSurplusAmount,
            currency: 'PLN',
          }
        : {
            label: 'VAT do zapłaty',
            amount: bundle.calculationSnapshot.vatPayableAmount,
            currency: 'PLN',
          },
    breakdown: {
      title: 'Podatki i składki',
      summaryLabel: 'PIT, ZUS i zdrowotna',
      summaryAmount: burdenAmount,
      rows: [
        {
          key: 'pit',
          label: 'PIT',
          amount: bundle.calculationSnapshot.pitAmount,
        },
        {
          key: 'zus',
          label: 'ZUS',
          amount: bundle.calculationSnapshot.zusAmount,
        },
        {
          key: 'health',
          label: 'Zdrowotna',
          amount: bundle.calculationSnapshot.healthContributionAmount,
        },
      ],
    },
    costSavings: {
      title: 'Korzyści z kosztów',
      summaryLabel: 'Zaoszczędzone na podatkach',
      summaryAmount: roundMoney(vatSavingsAmount + pitSavingsAmount),
      rows: [
        {
          key: 'vatSavings',
          label: 'VAT odzyskany na kosztach',
          amount: vatSavingsAmount,
        },
        {
          key: 'pitSavings',
          label: 'PIT zaoszczędzony na kosztach',
          amount: pitSavingsAmount,
        },
      ],
    },
    ipBoxEstimate: buildIpBoxEstimate(bundle),
    thresholdContext: buildThresholdContext(bundle),
    actions: {
      primaryLabel: 'Dodaj przychód',
      primaryRoute: '/add-income',
      secondaryLabel: 'Dodaj koszt',
      secondaryRoute: '/add-cost',
    },
  };
}

function buildIpBoxEstimate(
  bundle: ReportingPeriodBundle
): DashboardViewModel['ipBoxEstimate'] {
  const { calculationSnapshot, settingsSnapshot } = bundle;

  if (!settingsSnapshot.ipBox || settingsSnapshot.taxationForm === 'LUMP_SUM') {
    return null;
  }

  return {
    title: 'IP Box',
    caption: 'Szacunek rocznego rozliczenia. Miesięczny PIT powyżej pozostaje liczony standardowo.',
    warning: calculationSnapshot.ipBoxWarning,
    rows: [
      {
        key: 'basePit',
        label: 'PIT roczny bez IP Box',
        value: formatCurrencyAmount(calculationSnapshot.annualBasePitAmount),
        unit: 'PLN',
      },
      {
        key: 'pitAfter',
        label: 'PIT roczny po IP Box',
        value: formatCurrencyAmount(calculationSnapshot.annualPitAfterIpBoxAmount),
        unit: 'PLN',
      },
      {
        key: 'taxGain',
        label: 'Szacowana korzyść podatkowa',
        value: formatCurrencyAmount(calculationSnapshot.annualIpBoxTaxGainAmount),
        unit: 'PLN',
      },
      {
        key: 'qualifiedIncome',
        label: 'Kwalifikowany dochód przed nexus',
        value: formatCurrencyAmount(calculationSnapshot.annualQualifiedIpIncomeAmount),
        unit: 'PLN',
      },
      {
        key: 'qualifiedAfterNexus',
        label: 'Kwalifikowany dochód po nexus',
        value: formatCurrencyAmount(
          calculationSnapshot.annualQualifiedIpIncomeAfterNexusAmount
        ),
        unit: 'PLN',
      },
      {
        key: 'nexus',
        label: 'Współczynnik nexus',
        value: `${Math.round(calculationSnapshot.ipBoxNexusRatio * 100)}%`,
        unit: '%',
      },
    ],
  };
}

export function formatCurrencyAmount(value: number) {
  return amountFormatter.format(value);
}

function toBundlePeriodLabel(bundle: ReportingPeriodBundle) {
  const parsedFromId = parseReportingPeriodParts(bundle.reportingPeriod.id);
  const year = bundle.reportingPeriod.year ?? parsedFromId?.year;
  const month = bundle.reportingPeriod.month ?? parsedFromId?.month;

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return '';
  }

  return toMonthlyReportingPeriodLabel(
    createMonthlyReportingPeriod(year, month)
  );
}

function parseReportingPeriodParts(value: string) {
  const match = /^reporting-period-(\d{4})-(0[1-9]|1[0-2])$/.exec(value);

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
  };
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

function toCostFxLabel(cost: Cost) {
  if (cost.currency === 'PLN') {
    return null;
  }

  return `Kurs ${cost.exchangeRate.toFixed(4)} · ${cost.exchangeRateEffectiveDate}`;
}

function toIncomeFxLabel(income: Income) {
  if (income.currency === 'PLN') {
    return null;
  }

  return `Kurs ${income.exchangeRate.toFixed(4)} · ${income.exchangeRateEffectiveDate}`;
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

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clampRatio(value: number) {
  return Math.max(0, Math.min(1, value));
}

function formatPercentage(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatSnapshotStatusLabel(calculatedAt: string) {
  const parsedDate = new Date(calculatedAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Snapshot zapisany';
  }

  return `Snapshot z ${new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate)}`;
}

function buildThresholdContext(
  bundle: ReportingPeriodBundle
): DashboardViewModel['thresholdContext'] {
  const snapshot = bundle.calculationSnapshot;
  const settings = bundle.settingsSnapshot;
  const annualizedRevenue = roundMoney(snapshot.revenueAmount * 12);
  const annualizedTaxableBase = roundMoney(
    Math.max(0, snapshot.revenueAmount - snapshot.deductibleCostAmount - snapshot.zusAmount) * 12
  );

  switch (settings.taxationForm) {
    case 'SCALE': {
      const remainingToThreshold = Math.max(0, 120000 - annualizedTaxableBase);

      if (annualizedTaxableBase >= 120000) {
        return {
          title: 'Próg skali podatkowej',
          detail: `Szacowany roczny dochód ${formatCurrencyAmount(annualizedTaxableBase)} PLN wskazuje wejście w próg 32%.`,
        };
      }

      return {
        title: 'Próg skali podatkowej',
        detail: `Do progu 120 000 PLN brakuje ${formatCurrencyAmount(remainingToThreshold)} PLN przy utrzymaniu tego miesiąca.`,
      };
    }
    case 'LUMP_SUM': {
      const tier =
        annualizedRevenue > 300000
          ? 'powyżej 300 000 PLN'
          : annualizedRevenue > 60000
            ? '60 000 - 300 000 PLN'
            : 'poniżej 60 000 PLN';

      return {
        title: 'Próg zdrowotnej dla ryczałtu',
        detail: `Szacowany roczny przychód ${formatCurrencyAmount(annualizedRevenue)} PLN plasuje okres w przedziale ${tier}.`,
      };
    }
    default:
      return {
        title: 'Wynik roczny',
        detail: `Przy utrzymaniu tego miesiąca rocznie zostaje około ${formatCurrencyAmount(
          roundMoney(snapshot.netToHandAmount * 12)
        )} PLN na rękę.`,
      };
  }
}
