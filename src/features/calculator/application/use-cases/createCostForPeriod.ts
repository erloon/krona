import { createCost, type Cost } from '@/features/calculator/domain/entities/cost';
import { calculateMonthlySnapshot } from '@/features/calculator/domain/services/calculateMonthlySnapshot';
import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';

import type { CreateCostForPeriodCommand } from './costCommands';
import { loadIncomesForPeriodUseCase } from './loadIncomesForPeriod';

export async function createCostForPeriodUseCase(
  calculatorRepository: CalculatorRepository,
  settingsRepository: SettingsRepository,
  command: CreateCostForPeriodCommand
): Promise<ReportingPeriodBundle> {
  const bundle = await loadIncomesForPeriodUseCase(
    calculatorRepository,
    settingsRepository,
    command.period
  );
  const timestamp = new Date().toISOString();
  const cost = createCost({
    id: createCostId(),
    reportingPeriodId: bundle.reportingPeriod.id,
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
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return persistCostMutation(calculatorRepository, bundle, {
    nextCost: cost,
    deletedCostId: null,
  });
}

export async function persistCostMutation(
  calculatorRepository: CalculatorRepository,
  bundle: ReportingPeriodBundle,
  params: {
    nextCost: Cost | null;
    deletedCostId: string | null;
  }
): Promise<ReportingPeriodBundle> {
  if (params.nextCost) {
    await calculatorRepository.saveCost(params.nextCost);
  }

  if (params.deletedCostId) {
    await calculatorRepository.deleteCost(bundle.reportingPeriod.id, params.deletedCostId);
  }

  const costs = resolveNextCosts(bundle, params.nextCost, params.deletedCostId);
  const calculationSnapshot = calculateMonthlySnapshot({
    reportingPeriodId: bundle.reportingPeriod.id,
    settingsSnapshot: bundle.settingsSnapshot,
    incomes: bundle.incomes,
    costs,
  });

  await calculatorRepository.saveMonthlyCalculationSnapshot(calculationSnapshot);

  return {
    ...bundle,
    costs,
    calculationSnapshot,
  };
}

function resolveNextCosts(
  bundle: ReportingPeriodBundle,
  nextCost: Cost | null,
  deletedCostId: string | null
) {
  const costsWithoutDeleted = deletedCostId
    ? bundle.costs.filter((cost) => cost.id !== deletedCostId)
    : bundle.costs;

  if (!nextCost) {
    return costsWithoutDeleted;
  }

  const existingIndex = costsWithoutDeleted.findIndex((cost) => cost.id === nextCost.id);

  if (existingIndex === -1) {
    return [nextCost, ...costsWithoutDeleted];
  }

  return costsWithoutDeleted.map((cost) => (cost.id === nextCost.id ? nextCost : cost));
}

function createCostId() {
  if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `cost-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
