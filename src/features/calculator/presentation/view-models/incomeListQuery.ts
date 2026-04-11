import type {
  IncomeBillingType,
} from '@/features/calculator/domain/value-objects/IncomeBillingType';
import type { IncomeCurrency } from '@/features/calculator/domain/value-objects/IncomeCurrency';
import type { IncomeVatRate } from '@/features/calculator/domain/value-objects/IncomeVatRate';

import type { IncomeListItemViewModel } from './calculatorViewModels';

export type IncomeListFilterValue<T extends string> = T | 'ALL';

export type IncomeListFilters = Readonly<{
  vatRate: IncomeListFilterValue<IncomeVatRate>;
  currency: IncomeListFilterValue<IncomeCurrency>;
  billingType: IncomeListFilterValue<IncomeBillingType>;
}>;

export type IncomeListQueryResult = Readonly<{
  items: IncomeListItemViewModel[];
  hasAnyRecordsInPeriod: boolean;
  hasVisibleResults: boolean;
  appliedFilterCount: number;
}>;

export const defaultIncomeListFilters: IncomeListFilters = Object.freeze({
  vatRate: 'ALL',
  currency: 'ALL',
  billingType: 'ALL',
});

export function queryIncomeListItems(
  items: readonly IncomeListItemViewModel[],
  searchQuery: string,
  filters: IncomeListFilters
): IncomeListQueryResult {
  const normalizedQuery = normalizeSearchText(searchQuery);
  const sortedItems = [...items].sort(compareIncomeListItems);
  const visibleItems = sortedItems.filter(
    (item) =>
      matchesSearchQuery(item, normalizedQuery) &&
      matchesFilter(item.vatRate, filters.vatRate) &&
      matchesFilter(item.currency, filters.currency) &&
      matchesFilter(item.billingType, filters.billingType)
  );

  return {
    items: visibleItems,
    hasAnyRecordsInPeriod: sortedItems.length > 0,
    hasVisibleResults: visibleItems.length > 0,
    appliedFilterCount: getAppliedIncomeFilterCount(filters),
  };
}

export function getAppliedIncomeFilterCount(filters: IncomeListFilters): number {
  let count = 0;

  if (filters.vatRate !== 'ALL') {
    count += 1;
  }

  if (filters.currency !== 'ALL') {
    count += 1;
  }

  if (filters.billingType !== 'ALL') {
    count += 1;
  }

  return count;
}

export function hasActiveIncomeListFilters(filters: IncomeListFilters): boolean {
  return getAppliedIncomeFilterCount(filters) > 0;
}

function matchesSearchQuery(item: IncomeListItemViewModel, normalizedQuery: string): boolean {
  if (!normalizedQuery) {
    return true;
  }

  return normalizeSearchText(item.searchableText).includes(normalizedQuery);
}

function matchesFilter<T extends string>(value: T, filter: IncomeListFilterValue<T>): boolean {
  return filter === 'ALL' || value === filter;
}

function compareIncomeListItems(
  left: IncomeListItemViewModel,
  right: IncomeListItemViewModel
): number {
  if (left.createdAt !== right.createdAt) {
    return right.createdAt.localeCompare(left.createdAt);
  }

  return right.id.localeCompare(left.id);
}

function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase('pl-PL');
}
