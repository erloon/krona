import { createCost } from '@/features/calculator/domain/entities/cost';
import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';

import { persistCostMutation } from './createCostForPeriod';
import type { UpdateCostForPeriodCommand } from './costCommands';
import { loadIncomesForPeriodUseCase } from './loadIncomesForPeriod';

export async function updateCostForPeriodUseCase(
  calculatorRepository: CalculatorRepository,
  settingsRepository: SettingsRepository,
  command: UpdateCostForPeriodCommand
) {
  const bundle = await loadIncomesForPeriodUseCase(
    calculatorRepository,
    settingsRepository,
    command.period
  );
  const currentCost = requireCost(bundle, command.costId);
  const timestamp = new Date().toISOString();
  const nextCost = createCost({
    id: currentCost.id,
    reportingPeriodId: currentCost.reportingPeriodId,
    label: command.input.label,
    description: command.input.description,
    enteredNetAmount: command.input.enteredNetAmount,
    currency: command.input.currency,
    netAmount: command.input.netAmount,
    vatRate: command.input.vatRate,
    category: command.input.category,
    exchangeRate: command.input.exchangeRate,
    exchangeRateSource: command.input.exchangeRateSource,
    exchangeRateEffectiveDate: command.input.exchangeRateEffectiveDate,
    attachment: command.input.attachment,
    createdAt: currentCost.createdAt,
    updatedAt: timestamp,
  });

  return persistCostMutation(calculatorRepository, bundle, {
    nextCost,
    deletedCostId: null,
  });
}

function requireCost(bundle: ReportingPeriodBundle, costId: string) {
  const cost = bundle.costs.find((candidate) => candidate.id === costId);

  if (!cost) {
    throw new Error(`Cost ${costId} does not exist in reporting period ${bundle.reportingPeriod.id}.`);
  }

  return cost;
}
