import { createIncome } from '@/features/calculator/domain/entities/income';

import {
  applyIncomeFormCurrency,
  buildIncomeEditorInput,
  buildIncomeValidationInput,
  createDefaultIncomeFormState,
  incomeToFormState,
  isIncomeFormForeignCurrency,
} from './incomeFormState';

export function testCreateDefaultIncomeFormStateUsesPlnStaticFx(): void {
  const form = createDefaultIncomeFormState(new Date('2026-04-12T09:30:00.000Z'));

  assert(form.currency === 'PLN', 'Default form should start in PLN.');
  assert(form.exchangeRate === 1, 'PLN default should use unit exchange rate.');
  assert(form.exchangeRateSource === 'STATIC', 'PLN default should use STATIC source.');
  assert(
    form.exchangeRateEffectiveDate === '2026-04-12',
    'Default form should stamp the current effective date.'
  );
  assert(!isIncomeFormForeignCurrency(form), 'PLN default must not be treated as foreign currency.');
}

export function testApplyIncomeFormCurrencySwitchesBetweenPlnAndForeignFxStates(): void {
  const initial = createDefaultIncomeFormState(new Date('2026-04-12T09:30:00.000Z'));

  const eurForm = applyIncomeFormCurrency(initial, 'EUR', new Date('2026-04-15T09:30:00.000Z'));

  assert(eurForm.currency === 'EUR', 'Currency switch should update the selected currency.');
  assert(eurForm.exchangeRate === 1, 'Foreign currency should start from explicit placeholder rate.');
  assert(eurForm.exchangeRateSource === 'NBP_TABLE_A', 'Foreign currency should initialize NBP source.');
  assert(
    eurForm.exchangeRateEffectiveDate === '2026-04-15',
    'Foreign currency should stamp the explicit FX effective date.'
  );
  assert(isIncomeFormForeignCurrency(eurForm), 'Foreign currency must be marked as foreign.');

  const plnForm = applyIncomeFormCurrency(eurForm, 'PLN', new Date('2026-04-16T09:30:00.000Z'));

  assert(plnForm.currency === 'PLN', 'Switching back should restore PLN.');
  assert(plnForm.exchangeRateSource === 'STATIC', 'PLN should reset the FX source.');
  assert(plnForm.exchangeRateEffectiveDate === '2026-04-16', 'PLN reset should refresh the FX date.');
  assert(!isIncomeFormForeignCurrency(plnForm), 'PLN should clear foreign-currency state.');
}

export function testBuildIncomeValidationInputAndEditorInputKeepFxMetadata(): void {
  const form = applyIncomeFormCurrency(
    {
      ...createDefaultIncomeFormState(new Date('2026-04-12T09:30:00.000Z')),
      baseAmount: '1200.50',
      clientName: 'Acme Corp',
      invoiceNumber: 'FV/04/2026',
      workingDaysPerMonth: '18',
      workingHoursPerDay: '7',
      exchangeRate: 4.2731,
      exchangeRateSource: 'CUSTOM',
      exchangeRateEffectiveDate: '2026-04-10',
    },
    'EUR',
    new Date('2026-04-10T09:30:00.000Z')
  );
  const formWithCustomFx = {
    ...form,
    exchangeRate: 4.2731,
    exchangeRateSource: 'CUSTOM' as const,
    exchangeRateEffectiveDate: '2026-04-10',
  };

  const validationInput = buildIncomeValidationInput(formWithCustomFx);
  const editorInput = buildIncomeEditorInput(formWithCustomFx);

  assert(validationInput.currency === 'EUR', 'Validation input should keep selected currency.');
  assert(validationInput.exchangeRate === 4.2731, 'Validation input should keep explicit exchange rate.');
  assert(
    validationInput.exchangeRateEffectiveDate === '2026-04-10',
    'Validation input should keep explicit FX date.'
  );
  assert(editorInput.exchangeRate === 4.2731, 'Editor input should pass exchange rate to the use case.');
  assert(
    editorInput.exchangeRateSource === 'CUSTOM',
    'Editor input should pass the selected FX source to the use case.'
  );
  assert(
    editorInput.exchangeRateEffectiveDate === '2026-04-10',
    'Editor input should pass FX effective date to the use case.'
  );
}

export function testIncomeToFormStateMapsPersistedFxMetadata(): void {
  const income = createIncome({
    id: 'income-1',
    reportingPeriodId: '2026-04',
    label: 'FX contract',
    description: 'Foreign invoice',
    baseAmount: 9000,
    billingType: 'MONTHLY',
    currency: 'USD',
    vatRate: 'NP',
    clientName: 'Globex',
    invoiceNumber: 'INV-44',
    workParameters: {
      workingDaysPerMonth: 20,
      workingHoursPerDay: 8,
    },
    exchangeRate: 3.9876,
    exchangeRateSource: 'NBP_TABLE_A',
    exchangeRateEffectiveDate: '2026-04-08',
    createdAt: '2026-04-09T08:00:00.000Z',
    updatedAt: '2026-04-09T08:00:00.000Z',
  });

  const form = incomeToFormState(income);

  assert(form.currency === 'USD', 'Form mapping should preserve saved currency.');
  assert(form.exchangeRate === 3.9876, 'Form mapping should preserve saved exchange rate.');
  assert(form.exchangeRateSource === 'NBP_TABLE_A', 'Form mapping should preserve saved source.');
  assert(
    form.exchangeRateEffectiveDate === '2026-04-08',
    'Form mapping should preserve saved effective date.'
  );
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
