export const INCOME_VAT_RATES = ['NP', '0', '5', '8', '23'] as const;

export type IncomeVatRate = (typeof INCOME_VAT_RATES)[number];

export function isIncomeVatRate(value: string): value is IncomeVatRate {
  return INCOME_VAT_RATES.includes(value as IncomeVatRate);
}

export function assertIncomeVatRate(value: string): asserts value is IncomeVatRate {
  if (!isIncomeVatRate(value)) {
    throw new Error(`Invalid income VAT rate "${value}".`);
  }
}
