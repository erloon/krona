import { createCost } from '@/features/calculator/domain/entities/cost';
import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';

import { persistCostMutation } from './createCostForPeriod';
import type { DuplicateCostInPeriodCommand } from './costCommands';
import { loadIncomesForPeriodUseCase } from './loadIncomesForPeriod';

export async function duplicateCostInPeriodUseCase(
  calculatorRepository: CalculatorRepository,
  settingsRepository: SettingsRepository,
  command: DuplicateCostInPeriodCommand
) {
  const bundle = await loadIncomesForPeriodUseCase(
    calculatorRepository,
    settingsRepository,
    command.period
  );
  const sourceCost = requireCost(bundle, command.costId);
  const timestamp = new Date().toISOString();
  const duplicateCost = createCost({
    id: createCostId(),
    reportingPeriodId: sourceCost.reportingPeriodId,
    label: `${sourceCost.label} kopia`,
    description: sourceCost.description,
    netAmount: sourceCost.netAmount,
    vatRate: sourceCost.vatRate,
    category: sourceCost.category,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return persistCostMutation(calculatorRepository, bundle, {
    nextCost: duplicateCost,
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

function createCostId() {
  if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `cost-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
