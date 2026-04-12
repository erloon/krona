import {
  createReportingPeriodSettingsSnapshotFromAppSettings,
} from '@/features/calculator/domain/entities/reporting-period-settings-snapshot';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';
import {
  createMonthlyReportingPeriod,
} from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';

export async function syncAllReportingPeriodsWithSettingsUseCase(
  calculatorRepository: CalculatorRepository,
  settingsRepository: SettingsRepository
) {
  const [periods, settings] = await Promise.all([
    calculatorRepository.listReportingPeriods(),
    settingsRepository.getSettings(),
  ]);

  for (const period of periods) {
    await calculatorRepository.saveReportingPeriodSettingsSnapshot(
      createReportingPeriodSettingsSnapshotFromAppSettings(period.id, settings)
    );
    await calculatorRepository.getReportingPeriodBundle(
      createMonthlyReportingPeriod(period.year, period.month)
    );
  }
}
