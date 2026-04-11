const MONTHS_IN_YEAR = 12;
const MIN_MONTH = 1;
const MAX_MONTH = 12;

export type MonthlyReportingPeriodKey = `${number}-${string}`;

export type MonthlyReportingPeriod = Readonly<{
  year: number;
  month: number;
  key: MonthlyReportingPeriodKey;
}>;

export function createMonthlyReportingPeriod(year: number, month: number): MonthlyReportingPeriod {
  assertYear(year);
  assertMonth(month);

  return Object.freeze({
    year,
    month,
    key: formatMonthlyReportingPeriodKey(year, month),
  });
}

export function parseMonthlyReportingPeriod(value: string): MonthlyReportingPeriod {
  const match = /^(?<year>\d{4})-(?<month>0[1-9]|1[0-2])$/.exec(value);

  if (!match?.groups) {
    throw new Error(`Invalid monthly reporting period "${value}". Expected format YYYY-MM.`);
  }

  return createMonthlyReportingPeriod(Number(match.groups.year), Number(match.groups.month));
}

export function monthlyReportingPeriodFromDate(value: Date): MonthlyReportingPeriod {
  if (Number.isNaN(value.getTime())) {
    throw new Error('Cannot create a monthly reporting period from an invalid date.');
  }

  return createMonthlyReportingPeriod(value.getUTCFullYear(), value.getUTCMonth() + 1);
}

export function formatMonthlyReportingPeriodKey(year: number, month: number): MonthlyReportingPeriodKey {
  assertYear(year);
  assertMonth(month);

  return `${year}-${String(month).padStart(2, '0')}`;
}

export function compareMonthlyReportingPeriods(
  left: MonthlyReportingPeriod,
  right: MonthlyReportingPeriod
): number {
  if (left.year !== right.year) {
    return left.year - right.year;
  }

  return left.month - right.month;
}

export function isSameMonthlyReportingPeriod(
  left: MonthlyReportingPeriod,
  right: MonthlyReportingPeriod
): boolean {
  return compareMonthlyReportingPeriods(left, right) === 0;
}

export function getNextMonthlyReportingPeriod(
  period: MonthlyReportingPeriod
): MonthlyReportingPeriod {
  if (period.month === MAX_MONTH) {
    return createMonthlyReportingPeriod(period.year + 1, MIN_MONTH);
  }

  return createMonthlyReportingPeriod(period.year, period.month + 1);
}

export function getPreviousMonthlyReportingPeriod(
  period: MonthlyReportingPeriod
): MonthlyReportingPeriod {
  if (period.month === MIN_MONTH) {
    return createMonthlyReportingPeriod(period.year - 1, MAX_MONTH);
  }

  return createMonthlyReportingPeriod(period.year, period.month - 1);
}

export function addMonthsToMonthlyReportingPeriod(
  period: MonthlyReportingPeriod,
  months: number
): MonthlyReportingPeriod {
  if (!Number.isInteger(months)) {
    throw new Error(`Invalid month offset "${months}". Expected an integer.`);
  }

  const absoluteMonthIndex = period.year * MONTHS_IN_YEAR + (period.month - 1) + months;
  const normalizedYear = Math.floor(absoluteMonthIndex / MONTHS_IN_YEAR);
  const normalizedMonth = (absoluteMonthIndex % MONTHS_IN_YEAR + MONTHS_IN_YEAR) % MONTHS_IN_YEAR;

  return createMonthlyReportingPeriod(normalizedYear, normalizedMonth + 1);
}

export function getMonthlyReportingPeriodDateRange(
  period: MonthlyReportingPeriod
): Readonly<{
  startInclusive: Date;
  endExclusive: Date;
}> {
  return Object.freeze({
    startInclusive: new Date(Date.UTC(period.year, period.month - 1, 1)),
    endExclusive: new Date(Date.UTC(period.year, period.month, 1)),
  });
}

export function toMonthlyReportingPeriodLabel(period: MonthlyReportingPeriod, locale = 'pl-PL'): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return formatter.format(new Date(Date.UTC(period.year, period.month - 1, 1)));
}

function assertYear(year: number): void {
  if (!Number.isInteger(year) || year < 1) {
    throw new Error(`Invalid reporting year "${year}". Expected a positive integer.`);
  }
}

function assertMonth(month: number): void {
  if (!Number.isInteger(month) || month < MIN_MONTH || month > MAX_MONTH) {
    throw new Error(`Invalid reporting month "${month}". Expected a value between 1 and 12.`);
  }
}
