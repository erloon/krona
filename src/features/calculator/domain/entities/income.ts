export const INCOME_CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP', 'CHF'] as const;
export const INCOME_VAT_RATES = ['NP', '0', '5', '8', '23'] as const;

export type IncomeCurrency = (typeof INCOME_CURRENCIES)[number];
export type IncomeVatRate = (typeof INCOME_VAT_RATES)[number];

export type Income = Readonly<{
  id: string;
  reportingPeriodId: string;
  label: string;
  description: string;
  netAmount: number;
  currency: IncomeCurrency;
  vatRate: IncomeVatRate;
  createdAt: string;
  updatedAt: string;
}>;

export function createIncome(params: {
  id: string;
  reportingPeriodId: string;
  label: string;
  description?: string;
  netAmount: number;
  currency?: IncomeCurrency;
  vatRate?: IncomeVatRate;
  createdAt?: string;
  updatedAt?: string;
}): Income {
  const timestamp = params.createdAt ?? new Date().toISOString();

  return Object.freeze({
    id: params.id,
    reportingPeriodId: params.reportingPeriodId,
    label: params.label.trim(),
    description: params.description?.trim() ?? '',
    netAmount: params.netAmount,
    currency: params.currency ?? 'PLN',
    vatRate: params.vatRate ?? '23',
    createdAt: timestamp,
    updatedAt: params.updatedAt ?? timestamp,
  });
}
