import { createIncome } from '@/features/calculator/domain/entities/income';
import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';

import { loadIncomesForPeriodUseCase } from './loadIncomesForPeriod';
import type { DuplicateIncomeInPeriodCommand } from './incomeCommands';
import { persistIncomeMutation } from './createIncomeForPeriod';

export async function duplicateIncomeInPeriodUseCase(
  calculatorRepository: CalculatorRepository,
  settingsRepository: SettingsRepository,
  command: DuplicateIncomeInPeriodCommand
): Promise<ReportingPeriodBundle> {
  const bundle = await loadIncomesForPeriodUseCase(
    calculatorRepository,
    settingsRepository,
    command.period
  );
  const sourceIncome = requireIncome(bundle, command.incomeId);
  const timestamp = new Date().toISOString();
  const duplicateIncome = createIncome({
    id: createIncomeId(),
    reportingPeriodId: sourceIncome.reportingPeriodId,
    label: `${sourceIncome.label} kopia`,
    description: sourceIncome.description,
    billingType: sourceIncome.billingType,
    baseAmount: sourceIncome.baseAmount,
    currency: sourceIncome.currency,
    vatRate: sourceIncome.vatRate,
    workParameters: sourceIncome.workParameters,
    exchangeRate: sourceIncome.exchangeRate,
    exchangeRateSource: sourceIncome.exchangeRateSource,
    exchangeRateEffectiveDate: sourceIncome.exchangeRateEffectiveDate,
    lumpSumRate: sourceIncome.lumpSumRate,
    ipBoxQualifiedIncomePercent: sourceIncome.ipBoxQualifiedIncomePercent,
    isActive: sourceIncome.isActive,
    clientName: sourceIncome.clientName,
    invoiceNumber: sourceIncome.invoiceNumber,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return persistIncomeMutation(calculatorRepository, bundle, {
    nextIncome: duplicateIncome,
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

function createIncomeId() {
  if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `income-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
