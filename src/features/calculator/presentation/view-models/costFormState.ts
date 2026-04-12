import type { CostEditorInput } from '@/features/calculator/application/use-cases/costCommands';
import type {
  Cost,
  CostAttachment,
  CostCategory,
  CostCurrency,
  CostVatRate,
} from '@/features/calculator/domain/entities/cost';
import type { IncomeExchangeRateSource } from '@/features/calculator/domain/entities/income';
import {
  calculateCostPreview,
  type CostPreview,
} from '@/features/calculator/domain/services/calculateCostPreview';
import {
  validateCostBusinessRules,
  type CostValidationInput,
} from '@/features/calculator/domain/services/validateCostBusinessRules';
import type { ReportingPeriodSettingsSnapshot } from '@/features/calculator/domain/entities/reporting-period-settings-snapshot';

export type CostFormState = Readonly<{
  label: string;
  description: string;
  enteredNetAmount: string;
  currency: CostCurrency;
  vatRate: CostVatRate;
  category: CostCategory;
  exchangeRate: string;
  exchangeRateSource: IncomeExchangeRateSource;
  exchangeRateEffectiveDate: string;
  attachment: CostAttachment | null;
}>;

export function createDefaultCostFormState(now = new Date()): CostFormState {
  return {
    label: '',
    description: '',
    enteredNetAmount: '',
    currency: 'PLN',
    vatRate: '23',
    category: 'STANDARD',
    exchangeRate: '1',
    exchangeRateSource: 'STATIC',
    exchangeRateEffectiveDate: now.toISOString().slice(0, 10),
    attachment: null,
  };
}

export function costToFormState(cost: Cost): CostFormState {
  return {
    label: cost.label,
    description: cost.description,
    enteredNetAmount: cost.enteredNetAmount.toFixed(2).replace('.', ','),
    currency: cost.currency,
    vatRate: cost.vatRate,
    category: cost.category,
    exchangeRate: normalizeExchangeRateValue(cost.exchangeRate),
    exchangeRateSource: cost.exchangeRateSource,
    exchangeRateEffectiveDate: cost.exchangeRateEffectiveDate,
    attachment: cost.attachment,
  };
}

export function applyCostFormCurrency(
  form: CostFormState,
  currency: CostCurrency,
  now = new Date()
): CostFormState {
  return {
    ...form,
    currency,
    exchangeRate: currency === 'PLN' ? '1' : form.exchangeRate === '1' ? '' : form.exchangeRate,
    exchangeRateSource: currency === 'PLN' ? 'STATIC' : 'NBP_TABLE_A',
    exchangeRateEffectiveDate: now.toISOString().slice(0, 10),
  };
}

export function buildCostPreview(
  form: CostFormState,
  settingsSnapshot: Pick<ReportingPeriodSettingsSnapshot, 'taxationForm' | 'vatStatus'>
): CostPreview {
  return calculateCostPreview(
    {
      netAmount: resolvePlnNetAmount(form),
      vatRate: form.vatRate,
      category: form.category,
    },
    settingsSnapshot
  );
}

export function buildCostValidationInput(form: CostFormState): CostValidationInput {
  return {
    label: form.label,
    enteredNetAmount: parseDecimalInput(form.enteredNetAmount),
    vatRate: form.vatRate,
    category: form.category,
    exchangeRate: parseDecimalInput(form.exchangeRate),
    attachmentUri: form.attachment?.uri ?? null,
  };
}

export function buildCostValidationResult(
  form: CostFormState,
  settingsSnapshot: Pick<ReportingPeriodSettingsSnapshot, 'taxationForm' | 'vatStatus'>
) {
  return validateCostBusinessRules(buildCostValidationInput(form), settingsSnapshot);
}

export function buildCostEditorInput(form: CostFormState): CostEditorInput {
  return {
    label: form.label.trim(),
    description: form.description.trim(),
    enteredNetAmount: parseDecimalInput(form.enteredNetAmount),
    currency: form.currency,
    netAmount: resolvePlnNetAmount(form),
    vatRate: form.vatRate,
    category: form.category,
    exchangeRate: parseDecimalInput(form.exchangeRate),
    exchangeRateSource: form.exchangeRateSource,
    exchangeRateEffectiveDate: form.exchangeRateEffectiveDate,
    attachment: form.attachment,
  };
}

export function normalizeDecimalInput(value: string) {
  const normalized = value.replace(/[^0-9,.\s]/g, '').replace(/\s/g, '');
  const separator = normalized.includes(',') ? ',' : '.';
  const sanitized = normalized.replace(/[,.]/g, (match, offset) => (match === separator && offset === normalized.indexOf(separator) ? match : ''));
  return sanitized.replace('.', ',');
}

export function parseDecimalInput(value: string) {
  return Number(value.replace(',', '.'));
}

export function resolvePlnNetAmount(form: Pick<CostFormState, 'enteredNetAmount' | 'exchangeRate'>) {
  const enteredNetAmount = parseDecimalInput(form.enteredNetAmount);
  const exchangeRate = parseDecimalInput(form.exchangeRate);
  return roundMoney(enteredNetAmount * exchangeRate);
}

export function attachCostReference(
  current: CostFormState,
  params: {
    uri: string;
    fileName?: string;
    mimeType?: string | null;
    fileSize?: number | null;
    addedAt?: string;
  }
): CostFormState {
  const trimmedUri = params.uri.trim();

  if (!trimmedUri) {
    return current;
  }

  return {
    ...current,
    attachment: {
      uri: trimmedUri,
      fileName: params.fileName?.trim() || inferFileName(trimmedUri),
      mimeType: params.mimeType?.trim() || null,
      fileSize: params.fileSize ?? null,
      addedAt: params.addedAt ?? new Date().toISOString(),
    },
  };
}

export function detachCostReference(current: CostFormState): CostFormState {
  return {
    ...current,
    attachment: null,
  };
}

function inferFileName(uri: string) {
  const parts = uri.split(/[\\/]/);
  return parts[parts.length - 1] || 'attachment';
}

function normalizeExchangeRateValue(value: number) {
  return value.toFixed(4).replace(/0+$/, '').replace(/[,.]$/, '').replace('.', ',');
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}
