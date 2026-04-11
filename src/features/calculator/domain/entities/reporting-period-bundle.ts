import type { Cost } from './cost';
import type { Income } from './income';
import type { MonthlyCalculationSnapshot } from './monthly-calculation-snapshot';
import type { ReportingPeriod } from './reporting-period';
import type { ReportingPeriodSettingsSnapshot } from './reporting-period-settings-snapshot';

export type ReportingPeriodBundle = Readonly<{
  reportingPeriod: ReportingPeriod;
  settingsSnapshot: ReportingPeriodSettingsSnapshot;
  calculationSnapshot: MonthlyCalculationSnapshot;
  incomes: readonly Income[];
  costs: readonly Cost[];
}>;
