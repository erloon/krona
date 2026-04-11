export const INCOME_BILLING_TYPES = ['MONTHLY', 'DAILY', 'HOURLY'] as const;

export type IncomeBillingType = (typeof INCOME_BILLING_TYPES)[number];

export function isIncomeBillingType(value: string): value is IncomeBillingType {
  return INCOME_BILLING_TYPES.includes(value as IncomeBillingType);
}

export function assertIncomeBillingType(value: string): asserts value is IncomeBillingType {
  if (!isIncomeBillingType(value)) {
    throw new Error(`Invalid income billing type "${value}".`);
  }
}
