import { createCost } from '@/features/calculator/domain/entities/cost';

import {
  applyCostFormCurrency,
  attachCostReference,
  buildCostEditorInput,
  buildCostValidationInput,
  costToFormState,
  createDefaultCostFormState,
  resolvePlnNetAmount,
} from './costFormState';

export function testCreateDefaultCostFormStateStartsInPln(): void {
  const form = createDefaultCostFormState(new Date('2026-04-12T09:30:00.000Z'));

  assert(form.currency === 'PLN', 'Default cost form should start in PLN.');
  assert(form.exchangeRate === '1', 'PLN default should keep unit exchange rate.');
  assert(form.exchangeRateSource === 'STATIC', 'PLN default should use STATIC source.');
  assert(form.exchangeRateEffectiveDate === '2026-04-12', 'Default date should be stamped from now.');
}

export function testApplyCostFormCurrencyAndEditorInputKeepFxMetadata(): void {
  const eurForm = applyCostFormCurrency(
    {
      ...createDefaultCostFormState(new Date('2026-04-12T09:30:00.000Z')),
      enteredNetAmount: '120,50',
      label: 'Licencja',
      exchangeRate: '4,2731',
      exchangeRateSource: 'CUSTOM',
      exchangeRateEffectiveDate: '2026-04-10',
    },
    'EUR',
    new Date('2026-04-10T09:30:00.000Z')
  );
  const form = {
    ...eurForm,
    exchangeRate: '4,2731',
    exchangeRateSource: 'CUSTOM' as const,
  };

  const validationInput = buildCostValidationInput(form);
  const editorInput = buildCostEditorInput(form);

  assert(validationInput.enteredNetAmount === 120.5, 'Validation input should parse entered amount.');
  assert(validationInput.exchangeRate === 4.2731, 'Validation input should keep exchange rate.');
  assert(editorInput.currency === 'EUR', 'Editor input should keep foreign currency.');
  assert(editorInput.netAmount === 514.9086, 'Editor input should calculate PLN snapshot from raw input.');
  assert(editorInput.exchangeRateSource === 'CUSTOM', 'Editor input should keep explicit FX source.');
}

export function testCostToFormStateAndAttachmentDraftRoundTrip(): void {
  const cost = createCost({
    id: 'cost-1',
    reportingPeriodId: 'reporting-period-2026-04',
    label: 'Hosting',
    description: 'Roczny plan',
    enteredNetAmount: 49,
    currency: 'USD',
    netAmount: 196,
    vatRate: '0',
    category: 'STANDARD',
    exchangeRate: 4,
    exchangeRateSource: 'NBP_TABLE_A',
    exchangeRateEffectiveDate: '2026-04-08',
    attachment: {
      uri: 'file:///tmp/invoice.pdf',
      fileName: 'invoice.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024,
      addedAt: '2026-04-09T08:00:00.000Z',
    },
    createdAt: '2026-04-09T08:00:00.000Z',
    updatedAt: '2026-04-09T08:00:00.000Z',
  });

  const form = costToFormState(cost);
  const withAttachment = attachCostReference(form, {
    uri: 'file:///tmp/receipt.jpg',
    fileName: 'receipt.jpg',
  });

  assert(form.currency === 'USD', 'Persisted cost should map saved currency to form state.');
  assert(form.exchangeRate === '4', 'Persisted cost should map saved exchange rate.');
  assert(resolvePlnNetAmount(form) === 196, 'PLN amount should recompute from entered amount and FX.');
  assert(withAttachment.attachment?.fileName === 'receipt.jpg', 'Attachment helper should update draft metadata.');
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
