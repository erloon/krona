import { createIncome } from '@/features/calculator/domain/entities/income';
import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';
import type { ExchangeRateProvider } from '@/features/calculator/application/services/ExchangeRateProvider';
import { resolveIncomeEditorFx } from '@/features/calculator/application/services/resolveFxInput';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';

import { loadIncomesForPeriodUseCase } from './loadIncomesForPeriod';
import type { UpdateIncomeForPeriodCommand } from './incomeCommands';
import { persistIncomeMutation } from './createIncomeForPeriod';

export async function updateIncomeForPeriodUseCase(
  calculatorRepository: CalculatorRepository,
  settingsRepository: SettingsRepository,
  exchangeRateProviderOrCommand: ExchangeRateProvider | UpdateIncomeForPeriodCommand,
  maybeCommand?: UpdateIncomeForPeriodCommand
): Promise<ReportingPeriodBundle> {
  const exchangeRateProvider = maybeCommand
    ? (exchangeRateProviderOrCommand as ExchangeRateProvider)
    : undefined;
  const command = maybeCommand ??
    (exchangeRateProviderOrCommand as UpdateIncomeForPeriodCommand);
  const bundle = await loadIncomesForPeriodUseCase(
    calculatorRepository,
    settingsRepository,
    command.period
  );
  const currentIncome = requireIncome(bundle, command.incomeId);
  const timestamp = new Date().toISOString();
  const resolvedInput = await resolveIncomeEditorFx(command.input, exchangeRateProvider);
  const nextIncome = createIncome({
    id: currentIncome.id,
    reportingPeriodId: currentIncome.reportingPeriodId,
    label: resolvedInput.label,
    description: resolvedInput.description,
    billingType: resolvedInput.billingType,
    baseAmount: resolvedInput.baseAmount,
    currency: resolvedInput.currency,
    vatRate: resolvedInput.vatRate,
    workParameters: resolvedInput.workParameters,
    exchangeRate: resolvedInput.exchangeRate,
    exchangeRateSource: resolvedInput.exchangeRateSource,
    exchangeRateReferenceDate: resolvedInput.exchangeRateReferenceDate,
    exchangeRateEffectiveDate: resolvedInput.exchangeRateEffectiveDate,
    lumpSumRate: currentIncome.lumpSumRate,
    ipBoxQualifiedIncomePercent: currentIncome.ipBoxQualifiedIncomePercent,
    isActive: currentIncome.isActive,
    clientName: resolvedInput.clientName,
    invoiceNumber: resolvedInput.invoiceNumber,
    createdAt: currentIncome.createdAt,
    updatedAt: timestamp,
  });

  return persistIncomeMutation(calculatorRepository, bundle, {
    nextIncome,
    deletedIncomeId: null,
  });
}

function requireIncome(bundle: ReportingPeriodBundle, incomeId: string) {
  const income = bundle.incomes.find((candidate) => candidate.id === incomeId);

  if (!income) {
    throw new Error(`Income ${incomeId} does not exist in reporting period ${bundle.reportingPeriod.id}.`);
  }

  return income;
}
