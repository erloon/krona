import type { CostCategory, CostVatRate } from '@/features/calculator/domain/entities/cost';
import type { ReportingPeriodSettingsSnapshot } from '@/features/calculator/domain/entities/reporting-period-settings-snapshot';

type CostPreviewSettings = {
  taxationForm: ReportingPeriodSettingsSnapshot['taxationForm'];
  vatStatus: ReportingPeriodSettingsSnapshot['vatStatus'];
};

export type CostPreviewInput = Readonly<{
  netAmount: number;
  vatRate: CostVatRate;
  category: CostCategory;
}>;

export type CostPreview = Readonly<{
  vatAmount: number;
  deductibleVatAmount: number;
  nonDeductibleVatAmount: number;
  deductibleCostAmount: number;
  economicCostAmount: number;
  taxEffectLabel: string;
  cashEffectLabel: string;
}>;

export function calculateCostPreview(
  input: CostPreviewInput,
  settingsSnapshot: CostPreviewSettings
): CostPreview {
  const vatAmount = roundMoney(input.netAmount * parseVatRate(input.vatRate));
  const deductibleVatShare = getDeductibleVatShare(input.category, settingsSnapshot.vatStatus);
  const deductibleVatAmount = roundMoney(vatAmount * deductibleVatShare);
  const nonDeductibleVatAmount = roundMoney(vatAmount - deductibleVatAmount);
  const deductibleCostShare = settingsSnapshot.taxationForm === 'LUMP_SUM'
    ? 0
    : getDeductibleCostShare(input.category);
  const deductibleCostAmount = roundMoney(
    (input.netAmount + nonDeductibleVatAmount) * deductibleCostShare
  );
  const economicCostAmount = roundMoney(input.netAmount + nonDeductibleVatAmount);
  const taxEffectLabel =
    settingsSnapshot.taxationForm === 'LUMP_SUM'
      ? 'Ryczałt: koszt nie obniża PIT ani zdrowotnej.'
      : `Podstawa PIT/Zdrowotna: ${formatPercentLabel(deductibleCostShare)} kosztu.`;
  const cashEffectLabel =
    deductibleVatAmount > 0
      ? 'Koszt gotówkowy uwzględnia tylko nieodliczalny VAT.'
      : 'Koszt gotówkowy obejmuje pełny VAT.';

  return {
    vatAmount,
    deductibleVatAmount,
    nonDeductibleVatAmount,
    deductibleCostAmount,
    economicCostAmount,
    taxEffectLabel,
    cashEffectLabel,
  };
}

function getDeductibleVatShare(
  category: CostCategory,
  vatStatus: CostPreviewSettings['vatStatus']
) {
  if (vatStatus !== 'ACTIVE') {
    return 0;
  }

  return category === 'CAR_MIXED' ? 0.5 : 1;
}

function getDeductibleCostShare(category: CostCategory) {
  return category === 'CAR_MIXED' ? 0.75 : 1;
}

function parseVatRate(vatRate: CostVatRate) {
  if (vatRate === 'ZW') {
    return 0;
  }

  return Number(vatRate) / 100;
}

function formatPercentLabel(value: number) {
  return `${Math.round(value * 100)}%`;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
