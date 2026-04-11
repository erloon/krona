import {
  INCOME_BILLING_TYPES,
  type IncomeBillingType,
  assertIncomeBillingType,
} from '@/features/calculator/domain/value-objects/IncomeBillingType';
import {
  INCOME_CURRENCIES,
  type IncomeCurrency,
  assertIncomeCurrency,
} from '@/features/calculator/domain/value-objects/IncomeCurrency';
import {
  INCOME_EXCHANGE_RATE_SOURCES,
  type IncomeExchangeRateSource,
  assertIncomeExchangeRateSource,
} from '@/features/calculator/domain/value-objects/IncomeExchangeRateSource';
import {
  createIncomeSourceMetadata,
  type IncomeSourceMetadata,
} from '@/features/calculator/domain/value-objects/IncomeSourceMetadata';
import {
  INCOME_VAT_RATES,
  type IncomeVatRate,
  assertIncomeVatRate,
} from '@/features/calculator/domain/value-objects/IncomeVatRate';
import {
  createIncomeWorkParameters,
  type IncomeWorkParameters,
} from '@/features/calculator/domain/value-objects/IncomeWorkParameters';

export { INCOME_BILLING_TYPES, INCOME_CURRENCIES, INCOME_EXCHANGE_RATE_SOURCES, INCOME_VAT_RATES };
export type { IncomeBillingType, IncomeCurrency, IncomeExchangeRateSource, IncomeVatRate };

export type Income = Readonly<{
  id: string;
  reportingPeriodId: string;
  metadata: IncomeSourceMetadata;
  label: string;
  description: string;
  billingType: IncomeBillingType;
  baseAmount: number;
  currency: IncomeCurrency;
  vatRate: IncomeVatRate;
  workParameters: IncomeWorkParameters;
  exchangeRate: number;
  exchangeRateSource: IncomeExchangeRateSource;
  exchangeRateEffectiveDate: string;
  lumpSumRate: string | null;
  ipBoxQualifiedIncomePercent: string | null;
  isActive: boolean;
  clientName: string;
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
}>;

export function createIncome(params: {
  id: string;
  reportingPeriodId: string;
  label: string;
  description?: string;
  billingType?: IncomeBillingType;
  baseAmount: number;
  currency?: IncomeCurrency;
  vatRate?: IncomeVatRate;
  workParameters?: Partial<IncomeWorkParameters>;
  exchangeRate?: number;
  exchangeRateSource?: IncomeExchangeRateSource;
  exchangeRateEffectiveDate?: string;
  lumpSumRate?: string | null;
  ipBoxQualifiedIncomePercent?: string | null;
  isActive?: boolean;
  clientName?: string;
  invoiceNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}): Income {
  const reportingPeriodId = params.reportingPeriodId.trim();
  const timestamp = params.createdAt ?? new Date().toISOString();
  const billingType = params.billingType ?? 'MONTHLY';
  const currency = params.currency ?? 'PLN';
  const vatRate = params.vatRate ?? '23';
  const exchangeRateSource = params.exchangeRateSource ?? defaultExchangeRateSource(currency);
  const exchangeRateEffectiveDate = params.exchangeRateEffectiveDate ?? timestamp.slice(0, 10);
  const exchangeRate = params.exchangeRate ?? defaultExchangeRate(currency);
  const metadata = createIncomeSourceMetadata({
    label: params.label,
    description: params.description,
    clientName: params.clientName,
    invoiceNumber: params.invoiceNumber,
  });

  if (!reportingPeriodId) {
    throw new Error('Income must belong to a reporting period.');
  }

  if (!params.id.trim()) {
    throw new Error('Income id is required.');
  }

  assertIncomeBillingType(billingType);
  assertIncomeCurrency(currency);
  assertIncomeVatRate(vatRate);
  assertIncomeExchangeRateSource(exchangeRateSource);
  assertPositiveAmount(params.baseAmount, 'baseAmount');
  assertPositiveAmount(exchangeRate, 'exchangeRate');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(exchangeRateEffectiveDate)) {
    throw new Error(
      `Invalid exchangeRateEffectiveDate "${exchangeRateEffectiveDate}". Expected format YYYY-MM-DD.`
    );
  }

  const workParameters = createIncomeWorkParameters(params.workParameters, billingType);

  return Object.freeze({
    id: params.id,
    reportingPeriodId,
    metadata,
    label: metadata.label,
    description: metadata.description,
    billingType,
    baseAmount: normalizeMoney(params.baseAmount),
    currency,
    vatRate,
    workParameters,
    exchangeRate: normalizeMoney(exchangeRate),
    exchangeRateSource,
    exchangeRateEffectiveDate,
    lumpSumRate: normalizeOptionalString(params.lumpSumRate),
    ipBoxQualifiedIncomePercent: normalizeOptionalString(params.ipBoxQualifiedIncomePercent),
    isActive: params.isActive ?? true,
    clientName: metadata.clientName,
    invoiceNumber: metadata.invoiceNumber,
    createdAt: timestamp,
    updatedAt: params.updatedAt ?? timestamp,
  });
}

export function resolveIncomeMonthlyNetAmount(income: Income): number {
  if (!income.isActive) {
    return 0;
  }

  const baseMonthlyAmount = resolveBaseMonthlyAmount(income);

  return normalizeMoney(baseMonthlyAmount * income.exchangeRate);
}

function resolveBaseMonthlyAmount(income: Income): number {
  switch (income.billingType) {
    case 'DAILY':
      return income.baseAmount * income.workParameters.workingDaysPerMonth;
    case 'HOURLY':
      return (
        income.baseAmount *
        income.workParameters.workingDaysPerMonth *
        income.workParameters.workingHoursPerDay
      );
    default:
      return income.baseAmount;
  }
}

function defaultExchangeRate(currency: IncomeCurrency): number {
  return currency === 'PLN' ? 1 : 1;
}

function defaultExchangeRateSource(currency: IncomeCurrency): IncomeExchangeRateSource {
  return currency === 'PLN' ? 'STATIC' : 'NBP_TABLE_A';
}

function assertPositiveAmount(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid ${fieldName} "${value}". Expected a positive number.`);
  }
}

function normalizeMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}
