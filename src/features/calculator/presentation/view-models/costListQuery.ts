import type { CostCategory, CostVatRate } from '@/features/calculator/domain/entities/cost';

import type { CostListItemViewModel } from './calculatorViewModels';

type FilterChoice<T extends string> = T | 'ALL';

export type CostListFilters = Readonly<{
  category: FilterChoice<CostCategory>;
  vatRate: FilterChoice<CostVatRate>;
}>;

export const defaultCostListFilters: CostListFilters = {
  category: 'ALL',
  vatRate: 'ALL',
};

export function queryCostListItems(
  items: readonly CostListItemViewModel[],
  filters: CostListFilters
) {
  const visibleItems = items.filter((item) => {
    if (filters.category !== 'ALL' && item.category !== filters.category) {
      return false;
    }

    if (filters.vatRate !== 'ALL' && item.vatRate !== filters.vatRate) {
      return false;
    }

    return true;
  });

  return {
    items: visibleItems,
    hasAnyRecordsInPeriod: items.length > 0,
    hasVisibleResults: visibleItems.length > 0,
    appliedFilterCount: getAppliedCostFilterCount(filters),
  };
}

export function hasActiveCostListFilters(filters: CostListFilters) {
  return getAppliedCostFilterCount(filters) > 0;
}

function getAppliedCostFilterCount(filters: CostListFilters) {
  return [filters.category, filters.vatRate].filter((value) => value !== 'ALL').length;
}
