import type { IncomeCurrency, IncomeExchangeRateSource } from '@/features/calculator/domain/entities/income';

export type ResolvedExchangeRate = Readonly<{
  currency: IncomeCurrency;
  exchangeRate: number;
  exchangeRateSource: IncomeExchangeRateSource;
  exchangeRateReferenceDate: string;
  exchangeRateEffectiveDate: string;
}>;

export interface ExchangeRateProvider {
  getRate(currency: IncomeCurrency, referenceDate: string): Promise<ResolvedExchangeRate>;
}
