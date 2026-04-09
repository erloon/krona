export type BillingType = 'MONTHLY' | 'DAILY' | 'HOURLY';

export type Currency = 'PLN' | 'USD' | 'EUR' | 'GBP' | 'CHF';

export type VatRate = '23%' | '8%' | '5%' | '0%' | 'NP';

export type ExchangeRateSource = 'NBP_TABLE_A' | 'CUSTOM' | 'STATIC';

export type Income = {
  id: string;
  label: string;
  billingType: BillingType;
  baseAmount: number;
  currency: Currency;
  vatRate: VatRate;
  workingDaysPerMonth: number;
  workingHoursPerDay: number;
  exchangeRate: number;
  exchangeRateSource: ExchangeRateSource;
  exchangeRateEffectiveDate: string;
};
