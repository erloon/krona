import type { IncomeBillingType } from '@/features/calculator/domain/entities/income';

export function roundFxMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

export function resolveIncomeWorkMultiplier(
  billingType: IncomeBillingType,
  workingDaysPerMonth: number,
  workingHoursPerDay: number
) {
  switch (billingType) {
    case 'DAILY':
      return workingDaysPerMonth;
    case 'HOURLY':
      return workingDaysPerMonth * workingHoursPerDay;
    default:
      return 1;
  }
}

export function resolveIncomeMonthlyPlnAmount(params: {
  baseAmount: number;
  billingType: IncomeBillingType;
  workingDaysPerMonth: number;
  workingHoursPerDay: number;
  exchangeRate: number;
}) {
  return roundFxMoney(
    params.baseAmount *
      resolveIncomeWorkMultiplier(
        params.billingType,
        params.workingDaysPerMonth,
        params.workingHoursPerDay
      ) *
      params.exchangeRate
  );
}

export function convertIncomeBaseAmountPreservingPln(params: {
  currentPlnAmount: number;
  nextExchangeRate: number;
  billingType: IncomeBillingType;
  workingDaysPerMonth: number;
  workingHoursPerDay: number;
}) {
  const multiplier = resolveIncomeWorkMultiplier(
    params.billingType,
    params.workingDaysPerMonth,
    params.workingHoursPerDay
  );

  if (params.nextExchangeRate <= 0 || multiplier <= 0) {
    return 0;
  }

  return roundFxMoney(params.currentPlnAmount / params.nextExchangeRate / multiplier);
}

export function convertCostEnteredAmountPreservingPln(params: {
  currentPlnAmount: number;
  nextExchangeRate: number;
}) {
  if (params.nextExchangeRate <= 0) {
    return 0;
  }

  return roundFxMoney(params.currentPlnAmount / params.nextExchangeRate);
}
