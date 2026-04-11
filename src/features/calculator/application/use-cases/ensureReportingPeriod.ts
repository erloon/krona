import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';
import type { MonthlyReportingPeriod } from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';
import { createReportingPeriodSettingsSnapshotFromAppSettings } from '@/features/calculator/domain/entities/reporting-period-settings-snapshot';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';

export async function ensureReportingPeriodUseCase(
  calculatorRepository: CalculatorRepository,
  settingsRepository: SettingsRepository,
  period: MonthlyReportingPeriod
) {
  const settings = await settingsRepository.getSettings();

  return calculatorRepository.ensureReportingPeriod(
    period,
    createReportingPeriodSettingsSnapshotFromAppSettings('__pending__', settings)
  );
}
