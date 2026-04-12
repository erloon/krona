import { createIncome } from '@/features/calculator/domain/entities/income';
import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';

import { loadIncomesForPeriodUseCase } from './loadIncomesForPeriod';
import type { UpdateIncomeForPeriodCommand } from './incomeCommands';
import { persistIncomeMutation } from './createIncomeForPeriod';

export async function updateIncomeForPeriodUseCase(
  calculatorRepository: CalculatorRepository,
  settingsRepository: SettingsRepository,
  command: UpdateIncomeForPeriodCommand
): Promise<ReportingPeriodBundle> {
  const bundle = await loadIncomesForPeriodUseCase(
    calculatorRepository,
    settingsRepository,
    command.period
  );
  const currentIncome = requireIncome(bundle, command.incomeId);
  const timestamp = new Date().toISOString();
  const nextIncome = createIncome({
    id: currentIncome.id,
    reportingPeriodId: currentIncome.reportingPeriodId,
    label: command.input.label,
    description: command.input.description,
    billingType: command.input.billingType,
    baseAmount: command.input.baseAmount,
    currency: command.input.currency,
    vatRate: command.input.vatRate,
    workParameters: command.input.workParameters,
    exchangeRate: command.input.exchangeRate,
    exchangeRateSource: command.input.exchangeRateSource,
    exchangeRateEffectiveDate: command.input.exchangeRateEffectiveDate,
    lumpSumRate: currentIncome.lumpSumRate,
    ipBoxQualifiedIncomePercent: currentIncome.ipBoxQualifiedIncomePercent,
    isActive: currentIncome.isActive,
    clientName: command.input.clientName,
    invoiceNumber: command.input.invoiceNumber,
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
