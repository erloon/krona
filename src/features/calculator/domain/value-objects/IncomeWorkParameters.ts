import type { IncomeBillingType } from './IncomeBillingType';

export type IncomeWorkParameters = Readonly<{
  workingDaysPerMonth: number;
  workingHoursPerDay: number;
}>;

const DEFAULT_WORKING_DAYS_PER_MONTH = 21;
const DEFAULT_WORKING_HOURS_PER_DAY = 8;

export function createIncomeWorkParameters(
  params: Partial<IncomeWorkParameters> | undefined,
  billingType: IncomeBillingType
): IncomeWorkParameters {
  const workingDaysPerMonth = params?.workingDaysPerMonth ?? DEFAULT_WORKING_DAYS_PER_MONTH;
  const workingHoursPerDay = params?.workingHoursPerDay ?? DEFAULT_WORKING_HOURS_PER_DAY;

  assertPositiveInteger(workingDaysPerMonth, 'workingDaysPerMonth');
  assertPositiveInteger(workingHoursPerDay, 'workingHoursPerDay');

  if (billingType === 'MONTHLY' && params == null) {
    return Object.freeze({
      workingDaysPerMonth: DEFAULT_WORKING_DAYS_PER_MONTH,
      workingHoursPerDay: DEFAULT_WORKING_HOURS_PER_DAY,
    });
  }

  return Object.freeze({
    workingDaysPerMonth,
    workingHoursPerDay,
  });
}

function assertPositiveInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid ${fieldName} "${value}". Expected a positive integer.`);
  }
}
