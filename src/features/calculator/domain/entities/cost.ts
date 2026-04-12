import type { IncomeExchangeRateSource } from '@/features/calculator/domain/entities/income';

export const COST_CATEGORIES = ['STANDARD', 'CAR_MIXED', 'CAR_BUSINESS'] as const;
export const COST_CURRENCIES = ['PLN', 'USD', 'EUR', 'GBP', 'CHF'] as const;
export const COST_VAT_RATES = ['ZW', '0', '5', '8', '23'] as const;

export type CostCategory = (typeof COST_CATEGORIES)[number];
export type CostCurrency = (typeof COST_CURRENCIES)[number];
export type CostVatRate = (typeof COST_VAT_RATES)[number];

export type CostAttachment = Readonly<{
  uri: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  addedAt: string;
}>;

export type Cost = Readonly<{
  id: string;
  reportingPeriodId: string;
  label: string;
  description: string;
  nip: string;
  supplierName: string;
  supplierAddress: string;
  enteredNetAmount: number;
  currency: CostCurrency;
  netAmount: number;
  vatRate: CostVatRate;
  category: CostCategory;
  exchangeRate: number;
  exchangeRateSource: IncomeExchangeRateSource;
  exchangeRateReferenceDate: string;
  exchangeRateEffectiveDate: string;
  attachment: CostAttachment | null;
  createdAt: string;
  updatedAt: string;
}>;

export function createCost(params: {
  id: string;
  reportingPeriodId: string;
  label: string;
  description?: string;
  nip?: string;
  supplierName?: string;
  supplierAddress?: string;
  enteredNetAmount?: number;
  currency?: CostCurrency;
  netAmount: number;
  vatRate?: CostVatRate;
  category?: CostCategory;
  exchangeRate?: number;
  exchangeRateSource?: IncomeExchangeRateSource;
  exchangeRateReferenceDate?: string;
  exchangeRateEffectiveDate?: string;
  attachment?: CostAttachment | null;
  createdAt?: string;
  updatedAt?: string;
}): Cost {
  const timestamp = params.createdAt ?? new Date().toISOString();
  const currency = params.currency ?? 'PLN';
  const exchangeRate = params.exchangeRate ?? defaultExchangeRate(currency);
  const enteredNetAmount = params.enteredNetAmount ?? resolveEnteredNetAmount(params.netAmount, exchangeRate);

  assertCurrency(currency);
  assertVatRate(params.vatRate ?? '23');
  assertCategory(params.category ?? 'STANDARD');
  assertPositiveAmount(params.netAmount, 'netAmount');
  assertPositiveAmount(enteredNetAmount, 'enteredNetAmount');
  assertPositiveAmount(exchangeRate, 'exchangeRate');

  const exchangeRateReferenceDate = params.exchangeRateReferenceDate ?? timestamp.slice(0, 10);
  const exchangeRateEffectiveDate =
    params.exchangeRateEffectiveDate ?? exchangeRateReferenceDate;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(exchangeRateReferenceDate)) {
    throw new Error(
      `Invalid exchangeRateReferenceDate "${exchangeRateReferenceDate}". Expected format YYYY-MM-DD.`
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(exchangeRateEffectiveDate)) {
    throw new Error(
      `Invalid exchangeRateEffectiveDate "${exchangeRateEffectiveDate}". Expected format YYYY-MM-DD.`
    );
  }

  return Object.freeze({
    id: params.id,
    reportingPeriodId: params.reportingPeriodId,
    label: params.label.trim(),
    description: params.description?.trim() ?? '',
    nip: params.nip?.trim() ?? '',
    supplierName: params.supplierName?.trim() ?? '',
    supplierAddress: params.supplierAddress?.trim() ?? '',
    enteredNetAmount: normalizeMoney(enteredNetAmount),
    currency,
    netAmount: normalizeMoney(params.netAmount),
    vatRate: params.vatRate ?? '23',
    category: params.category ?? 'STANDARD',
    exchangeRate: normalizeMoney(exchangeRate),
    exchangeRateSource: params.exchangeRateSource ?? defaultExchangeRateSource(currency),
    exchangeRateReferenceDate,
    exchangeRateEffectiveDate,
    attachment: normalizeAttachment(params.attachment),
    createdAt: timestamp,
    updatedAt: params.updatedAt ?? timestamp,
  });
}

function resolveEnteredNetAmount(netAmount: number, exchangeRate: number) {
  return normalizeMoney(netAmount / exchangeRate);
}

function normalizeAttachment(attachment: CostAttachment | null | undefined) {
  if (!attachment) {
    return null;
  }

  const uri = attachment.uri.trim();

  if (!uri) {
    return null;
  }

  return Object.freeze({
    uri,
    fileName: attachment.fileName.trim() || fallbackFileName(uri),
    mimeType: attachment.mimeType?.trim() || null,
    fileSize: attachment.fileSize ?? null,
    addedAt: attachment.addedAt || new Date().toISOString(),
  });
}

function fallbackFileName(uri: string) {
  const pathParts = uri.split(/[\\/]/);
  return pathParts[pathParts.length - 1] || 'attachment';
}

function assertCurrency(value: string): asserts value is CostCurrency {
  if (!COST_CURRENCIES.includes(value as CostCurrency)) {
    throw new Error(`Invalid cost currency "${value}".`);
  }
}

function assertVatRate(value: string): asserts value is CostVatRate {
  if (!COST_VAT_RATES.includes(value as CostVatRate)) {
    throw new Error(`Invalid cost VAT rate "${value}".`);
  }
}

function assertCategory(value: string): asserts value is CostCategory {
  if (!COST_CATEGORIES.includes(value as CostCategory)) {
    throw new Error(`Invalid cost category "${value}".`);
  }
}

function assertPositiveAmount(value: number, fieldName: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid ${fieldName} "${value}". Expected a positive number.`);
  }
}

function defaultExchangeRate(currency: CostCurrency) {
  return currency === 'PLN' ? 1 : 1;
}

function defaultExchangeRateSource(currency: CostCurrency): IncomeExchangeRateSource {
  return currency === 'PLN' ? 'STATIC' : 'NBP_TABLE_A';
}

function normalizeMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}
