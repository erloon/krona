import { createCost } from '@/features/calculator/domain/entities/cost';
import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';
import type { ExchangeRateProvider } from '@/features/calculator/application/services/ExchangeRateProvider';
import { resolveCostEditorFx } from '@/features/calculator/application/services/resolveFxInput';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';

import { persistCostMutation } from './createCostForPeriod';
import type { UpdateCostForPeriodCommand } from './costCommands';
import { loadIncomesForPeriodUseCase } from './loadIncomesForPeriod';

export async function updateCostForPeriodUseCase(
  calculatorRepository: CalculatorRepository,
  settingsRepository: SettingsRepository,
  exchangeRateProviderOrCommand: ExchangeRateProvider | UpdateCostForPeriodCommand,
  maybeCommand?: UpdateCostForPeriodCommand
) {
  const exchangeRateProvider = maybeCommand
    ? (exchangeRateProviderOrCommand as ExchangeRateProvider)
    : undefined;
  const command = maybeCommand ??
    (exchangeRateProviderOrCommand as UpdateCostForPeriodCommand);
  const bundle = await loadIncomesForPeriodUseCase(
    calculatorRepository,
    settingsRepository,
    command.period
  );
  const currentCost = requireCost(bundle, command.costId);
  const timestamp = new Date().toISOString();
  const resolvedInput = await resolveCostEditorFx(command.input, exchangeRateProvider);
  const nextCost = createCost({
    id: currentCost.id,
    reportingPeriodId: currentCost.reportingPeriodId,
    label: resolvedInput.label,
    description: resolvedInput.description,
    enteredNetAmount: resolvedInput.enteredNetAmount,
    currency: resolvedInput.currency,
    netAmount: resolvedInput.netAmount,
    vatRate: resolvedInput.vatRate,
    category: resolvedInput.category,
    exchangeRate: resolvedInput.exchangeRate,
    exchangeRateSource: resolvedInput.exchangeRateSource,
    exchangeRateReferenceDate: resolvedInput.exchangeRateReferenceDate,
    exchangeRateEffectiveDate: resolvedInput.exchangeRateEffectiveDate,
    attachment: resolvedInput.attachment,
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
