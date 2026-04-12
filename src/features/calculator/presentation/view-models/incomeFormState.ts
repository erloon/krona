import type { IncomeEditorInput } from '@/features/calculator/application/use-cases/incomeCommands';
import type { Income, IncomeBillingType, IncomeCurrency, IncomeVatRate } from '@/features/calculator/domain/entities/income';
import type { IncomeExchangeRateSource } from '@/features/calculator/domain/value-objects/IncomeExchangeRateSource';
import type { IncomeValidationInput } from '@/features/calculator/domain/services/validateIncomeBusinessRules';

export type IncomeFormState = Readonly<{
  label: string;
  description: string;
  baseAmount: string;
  billingType: IncomeBillingType;
  currency: IncomeCurrency;
  vatRate: IncomeVatRate;
  clientName: string;
  invoiceNumber: string;
  workingDaysPerMonth: string;
  workingHoursPerDay: string;
  exchangeRate: number;
  exchangeRateSource: IncomeExchangeRateSource;
  exchangeRateEffectiveDate: string;
}>;

type IncomeFxState = Pick<
  IncomeFormState,
  'exchangeRate' | 'exchangeRateSource' | 'exchangeRateEffectiveDate'
>;

export function createDefaultIncomeFormState(now = new Date()): IncomeFormState {
  return {
    label: '',
    description: '',
    baseAmount: '',
    billingType: 'MONTHLY',
    currency: 'PLN',
    vatRate: '23',
    clientName: '',
    invoiceNumber: '',
    workingDaysPerMonth: '21',
    workingHoursPerDay: '8',
    ...createFxStateForCurrency('PLN', now),
  };
}

export function createFxStateForCurrency(
  currency: IncomeCurrency,
  now = new Date()
): IncomeFxState {
  return {
    exchangeRate: 1,
    exchangeRateSource: currency === 'PLN' ? 'STATIC' : 'NBP_TABLE_A',
    exchangeRateEffectiveDate: formatExchangeRateEffectiveDate(now),
  };
}

export function applyIncomeFormCurrency(
  form: IncomeFormState,
  currency: IncomeCurrency,
  now = new Date()
): IncomeFormState {
  return {
    ...form,
    currency,
    ...createFxStateForCurrency(currency, now),
  };
}

export function isIncomeFormForeignCurrency(form: Pick<IncomeFormState, 'currency'>): boolean {
  return form.currency !== 'PLN';
}

export function incomeToFormState(income: Income): IncomeFormState {
  return {
    label: income.label,
    description: income.description,
    baseAmount: income.baseAmount.toFixed(2),
    billingType: income.billingType,
    currency: income.currency,
    vatRate: income.vatRate,
    clientName: income.clientName,
    invoiceNumber: income.invoiceNumber,
    workingDaysPerMonth: String(income.workParameters.workingDaysPerMonth),
    workingHoursPerDay: String(income.workParameters.workingHoursPerDay),
    exchangeRate: income.exchangeRate,
    exchangeRateSource: income.exchangeRateSource,
    exchangeRateEffectiveDate: income.exchangeRateEffectiveDate,
  };
}

export function buildIncomeSummary(form: IncomeFormState) {
  const baseAmount = parseDecimalInput(form.baseAmount);
  const daysPerMonth = parseIntegerInput(form.workingDaysPerMonth);
  const hoursPerDay = parseIntegerInput(form.workingHoursPerDay);

  let netAmount = baseAmount;

  if (form.billingType === 'DAILY') {
    netAmount = baseAmount * daysPerMonth;
  }

  if (form.billingType === 'HOURLY') {
    netAmount = baseAmount * daysPerMonth * hoursPerDay;
  }

  const vatMultiplier = form.vatRate === 'NP' ? 0 : Number(form.vatRate) / 100;
  const vatAmount = netAmount * vatMultiplier;

  return {
    netAmount,
    vatAmount,
    grossAmount: netAmount + vatAmount,
    vatLabel: form.vatRate === 'NP' ? 'VAT (NP)' : `VAT (${form.vatRate}%)`,
  };
}

export function buildIncomeValidationInput(form: IncomeFormState): IncomeValidationInput {
  return {
    baseAmount: parseDecimalInput(form.baseAmount),
    billingType: form.billingType,
    currency: form.currency,
    vatRate: form.vatRate,
    workingDaysPerMonth: parseIntegerInput(form.workingDaysPerMonth),
    workingHoursPerDay: parseIntegerInput(form.workingHoursPerDay),
    exchangeRate: form.exchangeRate,
    exchangeRateEffectiveDate: form.exchangeRateEffectiveDate,
    ipBoxQualifiedIncomePercent: null,
    lumpSumRate: null,
  };
}

export function buildIncomeEditorInput(form: IncomeFormState): IncomeEditorInput {
  return {
    label: form.label.trim() || form.clientName.trim() || 'Nowe źródło przychodu',
    description: form.description,
    baseAmount: parseDecimalInput(form.baseAmount),
    billingType: form.billingType,
    currency: form.currency,
    vatRate: form.vatRate,
    clientName: form.clientName,
    invoiceNumber: form.invoiceNumber,
    workParameters: {
      workingDaysPerMonth: parseIntegerInput(form.workingDaysPerMonth),
      workingHoursPerDay: parseIntegerInput(form.workingHoursPerDay),
    },
    exchangeRate: form.exchangeRate,
    exchangeRateSource: form.exchangeRateSource,
    exchangeRateEffectiveDate: form.exchangeRateEffectiveDate,
  };
}

export function normalizeDecimalInput(value: string) {
  return value.replace(/[^0-9.,]/g, '').replace(',', '.');
}

export function normalizeIntegerInput(value: string) {
  return value.replace(/\D/g, '');
}

export function parseDecimalInput(value: string) {
  return Number(value.replace(',', '.'));
}

export function parseIntegerInput(value: string) {
  return Number(value);
}

function formatExchangeRateEffectiveDate(now: Date) {
  return now.toISOString().slice(0, 10);
}
