import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';
import type { MonthlyReportingPeriod } from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';

import { ensureReportingPeriodUseCase } from './ensureReportingPeriod';

export async function loadIncomesForPeriodUseCase(
  calculatorRepository: CalculatorRepository,
  settingsRepository: SettingsRepository,
  period: MonthlyReportingPeriod
): Promise<ReportingPeriodBundle> {
  await ensureReportingPeriodUseCase(calculatorRepository, settingsRepository, period);

  return calculatorRepository.getReportingPeriodBundle(period);
}
