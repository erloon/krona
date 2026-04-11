export const INCOME_CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP', 'CHF'] as const;

export type IncomeCurrency = (typeof INCOME_CURRENCIES)[number];

export function isIncomeCurrency(value: string): value is IncomeCurrency {
  return INCOME_CURRENCIES.includes(value as IncomeCurrency);
}

export function assertIncomeCurrency(value: string): asserts value is IncomeCurrency {
  if (!isIncomeCurrency(value)) {
    throw new Error(`Invalid income currency "${value}".`);
  }
}
