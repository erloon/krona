import type { CostEditorInput } from '@/features/calculator/application/use-cases/costCommands';
import type { IncomeEditorInput } from '@/features/calculator/application/use-cases/incomeCommands';
import type { ExchangeRateProvider } from '@/features/calculator/application/services/ExchangeRateProvider';

export async function resolveIncomeEditorFx(
  input: IncomeEditorInput,
  exchangeRateProvider?: ExchangeRateProvider
): Promise<IncomeEditorInput> {
  const resolvedRate = await resolveRate(
    input.currency,
    input.exchangeRateSource,
    input.exchangeRate,
    input.exchangeRateReferenceDate,
    input.exchangeRateEffectiveDate,
    exchangeRateProvider
  );

  return {
    ...input,
    exchangeRate: resolvedRate.exchangeRate,
    exchangeRateSource: resolvedRate.exchangeRateSource,
    exchangeRateReferenceDate: resolvedRate.exchangeRateReferenceDate,
    exchangeRateEffectiveDate: resolvedRate.exchangeRateEffectiveDate,
  };
}

export async function resolveCostEditorFx(
  input: CostEditorInput,
  exchangeRateProvider?: ExchangeRateProvider
): Promise<CostEditorInput> {
  const resolvedRate = await resolveRate(
    input.currency,
    input.exchangeRateSource,
    input.exchangeRate,
    input.exchangeRateReferenceDate,
    input.exchangeRateEffectiveDate,
    exchangeRateProvider
  );

  return {
    ...input,
    exchangeRate: resolvedRate.exchangeRate,
    exchangeRateSource: resolvedRate.exchangeRateSource,
    exchangeRateReferenceDate: resolvedRate.exchangeRateReferenceDate,
    exchangeRateEffectiveDate: resolvedRate.exchangeRateEffectiveDate,
    netAmount: roundFxMoney(input.enteredNetAmount * resolvedRate.exchangeRate),
  };
}

async function resolveRate(
  currency: IncomeEditorInput['currency'],
  exchangeRateSource: IncomeEditorInput['exchangeRateSource'],
  exchangeRate: number,
  exchangeRateReferenceDate: string,
  exchangeRateEffectiveDate: string,
  exchangeRateProvider?: ExchangeRateProvider
) {
  if (currency === 'PLN') {
    return {
      exchangeRate: 1,
      exchangeRateSource: 'STATIC' as const,
      exchangeRateReferenceDate,
      exchangeRateEffectiveDate: exchangeRateReferenceDate,
    };
  }

  if (exchangeRateSource === 'CUSTOM') {
    return {
      exchangeRate,
      exchangeRateSource,
      exchangeRateReferenceDate,
      exchangeRateEffectiveDate,
    };
  }

  if (!exchangeRateProvider) {
    return {
      exchangeRate,
      exchangeRateSource,
      exchangeRateReferenceDate,
      exchangeRateEffectiveDate,
    };
  }

  return exchangeRateProvider.getRate(currency, exchangeRateReferenceDate);
}

function roundFxMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}
