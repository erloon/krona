import { calculateCostPreview } from './calculateCostPreview';

export function testCalculateCostPreviewForStandardActiveVat(): void {
  const preview = calculateCostPreview(
    {
      netAmount: 1000,
      vatRate: '23',
      category: 'STANDARD',
    },
    {
      taxationForm: 'FLAT_19',
      vatStatus: 'ACTIVE',
    }
  );

  assert(preview.vatAmount === 230, 'Standard cost should calculate full VAT.');
  assert(preview.deductibleVatAmount === 230, 'Active VAT payer should deduct full standard VAT.');
  assert(preview.nonDeductibleVatAmount === 0, 'No VAT should remain non-deductible.');
  assert(preview.deductibleCostAmount === 1000, 'PIT deductible base should stay net for standard cost.');
  assert(preview.economicCostAmount === 1000, 'Cash effect should stay net when VAT is recoverable.');
}

export function testCalculateCostPreviewForMixedCarVatExempt(): void {
  const preview = calculateCostPreview(
    {
      netAmount: 1000,
      vatRate: '23',
      category: 'CAR_MIXED',
    },
    {
      taxationForm: 'SCALE',
      vatStatus: 'EXEMPT',
    }
  );

  assert(preview.deductibleVatAmount === 0, 'VAT exempt taxpayer should not deduct any VAT.');
  assert(preview.nonDeductibleVatAmount === 230, 'Full VAT should become non-deductible.');
  assert(preview.deductibleCostAmount === 922.5, 'Mixed-use car should deduct 75% of net plus non-deductible VAT.');
  assert(preview.economicCostAmount === 1230, 'Cash effect should include full VAT when no VAT is recoverable.');
}

export function testCalculateCostPreviewForLumpSumZeroesTaxDeduction(): void {
  const preview = calculateCostPreview(
    {
      netAmount: 800,
      vatRate: '8',
      category: 'STANDARD',
    },
    {
      taxationForm: 'LUMP_SUM',
      vatStatus: 'ACTIVE',
    }
  );

  assert(preview.vatAmount === 64, 'VAT should still be calculated under Lump Sum.');
  assert(preview.deductibleVatAmount === 64, 'Active VAT still offsets VAT under Lump Sum.');
  assert(preview.deductibleCostAmount === 0, 'Lump Sum should disable PIT deductible cost base.');
  assert(preview.economicCostAmount === 800, 'Cash effect should remain based on recoverable VAT rules.');
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
