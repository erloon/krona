import type { MonthlyReportingPeriod } from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';

import type { Cost } from '../entities/cost';
import type { Income } from '../entities/income';
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
  saveIncome(income: Income): Promise<Income>;
  deleteIncome(reportingPeriodId: string, incomeId: string): Promise<void>;
  saveCost(cost: Cost): Promise<Cost>;
  deleteCost(reportingPeriodId: string, costId: string): Promise<void>;
  saveMonthlyCalculationSnapshot(
    snapshot: MonthlyCalculationSnapshot
  ): Promise<MonthlyCalculationSnapshot>;
  hasAnyIncomes(): Promise<boolean>;
  hasAnyCosts(): Promise<boolean>;
}
