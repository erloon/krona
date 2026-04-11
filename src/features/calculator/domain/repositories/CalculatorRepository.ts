import type { MonthlyReportingPeriod } from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';

import type { MonthlyCalculationSnapshot } from '../entities/monthly-calculation-snapshot';
import type { ReportingPeriod } from '../entities/reporting-period';
import type { ReportingPeriodBundle } from '../entities/reporting-period-bundle';
import type { ReportingPeriodSettingsSnapshot } from '../entities/reporting-period-settings-snapshot';

export interface CalculatorRepository {
  ensureReportingPeriod(
    period: MonthlyReportingPeriod,
    settingsSnapshot: ReportingPeriodSettingsSnapshot
  ): Promise<ReportingPeriod>;
  getReportingPeriodBundle(period: MonthlyReportingPeriod): Promise<ReportingPeriodBundle>;
  saveMonthlyCalculationSnapshot(
    snapshot: MonthlyCalculationSnapshot
  ): Promise<MonthlyCalculationSnapshot>;
}
