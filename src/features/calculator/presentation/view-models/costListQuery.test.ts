import type { CostListItemViewModel } from './calculatorViewModels';
import {
  defaultCostListFilters,
  hasActiveCostListFilters,
  queryCostListItems,
} from './costListQuery';

const items: CostListItemViewModel[] = [
  {
    id: '1',
    title: 'Leasing',
    amount: 2450,
    netAmount: 1991.87,
    vatLabel: 'VAT 23%',
    categoryLabel: 'Auto mieszane',
    deductionLabel: 'Odliczenie: PIT 75% | VAT 50%',
    searchableText: 'Leasing CAR_MIXED 23',
    vatRate: '23',
    category: 'CAR_MIXED',
    createdAt: '2026-04-10T08:00:00.000Z',
  },
  {
    id: '2',
    title: 'Biuro',
    amount: 1200,
    netAmount: 975.61,
    vatLabel: 'VAT 23%',
    categoryLabel: 'Standard',
    deductionLabel: 'Odliczenie: PIT 100% | VAT 100%',
    searchableText: 'Biuro STANDARD 23',
    vatRate: '23',
    category: 'STANDARD',
    createdAt: '2026-04-09T08:00:00.000Z',
  },
];

export function testQueryCostListItemsAppliesFilters(): void {
  const result = queryCostListItems(items, {
    ...defaultCostListFilters,
    category: 'CAR_MIXED',
  });

  assert(result.items.length === 1, 'Category filter should narrow the list.');
  assert(result.items[0].id === '1', 'Expected the mixed-use car cost to remain visible.');
  assert(result.appliedFilterCount === 1, 'Expected a single applied filter.');
}

export function testHasActiveCostListFiltersReflectsFilterState(): void {
  assert(!hasActiveCostListFilters(defaultCostListFilters), 'Default filters should be inactive.');
  assert(
    hasActiveCostListFilters({
      ...defaultCostListFilters,
      vatRate: '23',
    }),
    'Changing VAT rate should mark filters as active.'
  );
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
