import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';

import { persistCostMutation } from './createCostForPeriod';
import type { DeleteCostFromPeriodCommand } from './costCommands';
import { loadIncomesForPeriodUseCase } from './loadIncomesForPeriod';

export async function deleteCostFromPeriodUseCase(
  calculatorRepository: CalculatorRepository,
  settingsRepository: SettingsRepository,
  command: DeleteCostFromPeriodCommand
) {
  const bundle = await loadIncomesForPeriodUseCase(
    calculatorRepository,
    settingsRepository,
    command.period
  );

  requireCost(bundle, command.costId);

  return persistCostMutation(calculatorRepository, bundle, {
    nextCost: null,
    deletedCostId: command.costId,
  });
}

function requireCost(bundle: ReportingPeriodBundle, costId: string) {
  const cost = bundle.costs.find((candidate) => candidate.id === costId);

  if (!cost) {
    throw new Error(`Cost ${costId} does not exist in reporting period ${bundle.reportingPeriod.id}.`);
  }

  return cost;
}
