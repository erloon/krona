export const INCOME_EXCHANGE_RATE_SOURCES = ['NBP_TABLE_A', 'CUSTOM', 'STATIC'] as const;

export type IncomeExchangeRateSource = (typeof INCOME_EXCHANGE_RATE_SOURCES)[number];

export function isIncomeExchangeRateSource(value: string): value is IncomeExchangeRateSource {
  return INCOME_EXCHANGE_RATE_SOURCES.includes(value as IncomeExchangeRateSource);
}

export function assertIncomeExchangeRateSource(
  value: string
): asserts value is IncomeExchangeRateSource {
  if (!isIncomeExchangeRateSource(value)) {
    throw new Error(`Invalid income exchange rate source "${value}".`);
  }
}
