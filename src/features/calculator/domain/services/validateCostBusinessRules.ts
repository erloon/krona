import type { CostCategory, CostVatRate } from '@/features/calculator/domain/entities/cost';
import type { ReportingPeriodSettingsSnapshot } from '@/features/calculator/domain/entities/reporting-period-settings-snapshot';

export type CostValidationInput = Readonly<{
  label: string;
  enteredNetAmount: number;
  vatRate: CostVatRate;
  category: CostCategory;
  exchangeRate: number;
  attachmentUri: string | null;
}>;

export type CostValidationMessage = Readonly<{
  message: string;
}>;

export type CostValidationResult = Readonly<{
  isValid: boolean;
  errors: readonly CostValidationMessage[];
  warnings: readonly CostValidationMessage[];
}>;

export function validateCostBusinessRules(
  input: CostValidationInput,
  settingsSnapshot: Pick<ReportingPeriodSettingsSnapshot, 'taxationForm' | 'vatStatus'>
): CostValidationResult {
  const errors: CostValidationMessage[] = [];
  const warnings: CostValidationMessage[] = [];

  if (!input.label.trim()) {
    errors.push({ message: 'Nazwa kosztu jest wymagana.' });
  }

  if (!Number.isFinite(input.enteredNetAmount) || input.enteredNetAmount <= 0) {
    errors.push({ message: 'Kwota netto musi być większa od zera.' });
  }

  if (!Number.isFinite(input.exchangeRate) || input.exchangeRate <= 0) {
    errors.push({ message: 'Kurs waluty musi być większy od zera.' });
  }

  if (settingsSnapshot.taxationForm === 'LUMP_SUM') {
    warnings.push({ message: 'Przy ryczałcie koszt nie obniża PIT ani zdrowotnej, wpływa tylko na gotówkę i VAT.' });
  }

  if (settingsSnapshot.vatStatus !== 'ACTIVE' && input.vatRate !== 'ZW' && input.vatRate !== '0') {
    warnings.push({ message: 'Przy statusie VAT zwolniony VAT z kosztu nie będzie odliczony i zwiększy koszt ekonomiczny.' });
  }

  if (input.category === 'CAR_BUSINESS') {
    warnings.push({ message: 'Tryb samochód firmowy zakłada spełnienie formalnych warunków użycia wyłącznie firmowego.' });
  }

  if (input.attachmentUri && !input.attachmentUri.trim()) {
    errors.push({ message: 'Referencja załącznika nie może być pusta.' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
