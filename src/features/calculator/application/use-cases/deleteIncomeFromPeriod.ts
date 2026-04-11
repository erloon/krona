import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';

import { persistIncomeMutation } from './createIncomeForPeriod';
import type { DeleteIncomeFromPeriodCommand } from './incomeCommands';
import { loadIncomesForPeriodUseCase } from './loadIncomesForPeriod';

export async function deleteIncomeFromPeriodUseCase(
  calculatorRepository: CalculatorRepository,
  settingsRepository: SettingsRepository,
  command: DeleteIncomeFromPeriodCommand
): Promise<ReportingPeriodBundle> {
  const bundle = await loadIncomesForPeriodUseCase(
    calculatorRepository,
    settingsRepository,
    command.period
  );

  requireIncome(bundle, command.incomeId);

  return persistIncomeMutation(calculatorRepository, bundle, {
    nextIncome: null,
    deletedIncomeId: command.incomeId,
  });
}

function requireIncome(bundle: ReportingPeriodBundle, incomeId: string) {
  const income = bundle.incomes.find((candidate) => candidate.id === incomeId);

  if (!income) {
    throw new Error(`Income ${incomeId} does not exist in reporting period ${bundle.reportingPeriod.id}.`);
  }

  return income;
}
