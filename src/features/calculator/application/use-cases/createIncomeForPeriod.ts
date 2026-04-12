import { calculateMonthlySnapshot } from '@/features/calculator/domain/services/calculateMonthlySnapshot';
import { createIncome, type Income } from '@/features/calculator/domain/entities/income';
import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';
import type { ExchangeRateProvider } from '@/features/calculator/application/services/ExchangeRateProvider';
import { resolveIncomeEditorFx } from '@/features/calculator/application/services/resolveFxInput';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';

import type { CreateIncomeForPeriodCommand } from './incomeCommands';
import { loadIncomesForPeriodUseCase } from './loadIncomesForPeriod';

export async function createIncomeForPeriodUseCase(
  calculatorRepository: CalculatorRepository,
  settingsRepository: SettingsRepository,
  exchangeRateProviderOrCommand: ExchangeRateProvider | CreateIncomeForPeriodCommand,
  maybeCommand?: CreateIncomeForPeriodCommand
): Promise<ReportingPeriodBundle> {
  const exchangeRateProvider = maybeCommand
    ? (exchangeRateProviderOrCommand as ExchangeRateProvider)
    : undefined;
  const command = maybeCommand ??
    (exchangeRateProviderOrCommand as CreateIncomeForPeriodCommand);
  const bundle = await loadIncomesForPeriodUseCase(
    calculatorRepository,
    settingsRepository,
    command.period
  );
  const timestamp = new Date().toISOString();
  const resolvedInput = await resolveIncomeEditorFx(command.input, exchangeRateProvider);
  const income = createIncome({
    id: createIncomeId(),
    reportingPeriodId: bundle.reportingPeriod.id,
    label: resolvedInput.label,
    description: resolvedInput.description,
    billingType: resolvedInput.billingType,
    baseAmount: resolvedInput.baseAmount,
    currency: resolvedInput.currency,
    vatRate: resolvedInput.vatRate,
    clientName: resolvedInput.clientName,
    invoiceNumber: resolvedInput.invoiceNumber,
    workParameters: resolvedInput.workParameters,
    exchangeRate: resolvedInput.exchangeRate,
    exchangeRateSource: resolvedInput.exchangeRateSource,
    exchangeRateReferenceDate: resolvedInput.exchangeRateReferenceDate,
    exchangeRateEffectiveDate: resolvedInput.exchangeRateEffectiveDate,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return persistIncomeMutation(calculatorRepository, bundle, {
    nextIncome: income,
    deletedIncomeId: null,
  });
}

export async function persistIncomeMutation(
  calculatorRepository: CalculatorRepository,
  bundle: ReportingPeriodBundle,
  params: {
    nextIncome: Income | null;
    deletedIncomeId: string | null;
  }
): Promise<ReportingPeriodBundle> {
  if (params.nextIncome) {
    await calculatorRepository.saveIncome(params.nextIncome);
  }

  if (params.deletedIncomeId) {
    await calculatorRepository.deleteIncome(bundle.reportingPeriod.id, params.deletedIncomeId);
  }

  const incomes = resolveNextIncomes(bundle, params.nextIncome, params.deletedIncomeId);
  const calculationSnapshot = calculateMonthlySnapshot({
    reportingPeriodId: bundle.reportingPeriod.id,
    settingsSnapshot: bundle.settingsSnapshot,
    incomes,
    costs: bundle.costs,
  });

  await calculatorRepository.saveMonthlyCalculationSnapshot(calculationSnapshot);

  return {
    ...bundle,
    incomes,
    calculationSnapshot,
  };
}

function resolveNextIncomes(
  bundle: ReportingPeriodBundle,
  nextIncome: Income | null,
  deletedIncomeId: string | null
) {
  const incomesWithoutDeleted = deletedIncomeId
    ? bundle.incomes.filter((income) => income.id !== deletedIncomeId)
    : bundle.incomes;

  if (!nextIncome) {
    return incomesWithoutDeleted;
  }

  const existingIndex = incomesWithoutDeleted.findIndex((income) => income.id === nextIncome.id);

  if (existingIndex === -1) {
    return [nextIncome, ...incomesWithoutDeleted];
  }

  return incomesWithoutDeleted.map((income) => (income.id === nextIncome.id ? nextIncome : income));
}

function createIncomeId() {
  if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `income-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
