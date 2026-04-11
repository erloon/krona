export const REPORTING_PERIOD_STATUS = {
  open: 'OPEN',
} as const;

export type ReportingPeriodStatus =
  (typeof REPORTING_PERIOD_STATUS)[keyof typeof REPORTING_PERIOD_STATUS];

export type ReportingPeriod = Readonly<{
  id: string;
  year: number;
  month: number;
  status: ReportingPeriodStatus;
  createdAt: string;
  updatedAt: string;
}>;

export function createReportingPeriod(params: {
  id: string;
  year: number;
  month: number;
  status?: ReportingPeriodStatus;
  createdAt?: string;
  updatedAt?: string;
}): ReportingPeriod {
  const timestamp = params.createdAt ?? new Date().toISOString();

  return Object.freeze({
    id: params.id,
    year: params.year,
    month: params.month,
    status: params.status ?? REPORTING_PERIOD_STATUS.open,
    createdAt: timestamp,
    updatedAt: params.updatedAt ?? timestamp,
  });
}
