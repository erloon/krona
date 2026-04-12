import type { IncomeListItemViewModel } from './calculatorViewModels';
import {
  defaultIncomeListFilters,
  getAppliedIncomeFilterCount,
  hasActiveIncomeListFilters,
  queryIncomeListItems,
  type IncomeListFilters,
} from './incomeListQuery';

export function testIncomeListQuerySearchMatchesRelevantFields(): void {
  const items = createItems();

  assert(queryIncomeListItems(items, ' ACME ', defaultIncomeListFilters).items.length === 1);
  assert(queryIncomeListItems(items, 'premium support', defaultIncomeListFilters).items.length === 1);
  assert(queryIncomeListItems(items, 'nebula', defaultIncomeListFilters).items.length === 1);
  assert(queryIncomeListItems(items, 'FV/03/2026', defaultIncomeListFilters).items.length === 1);
}

export function testIncomeListQueryFiltersWorkIndividuallyAndTogether(): void {
  const items = createItems();

  assert(
    queryIncomeListItems(items, '', {
      ...defaultIncomeListFilters,
      vatRate: '23',
    }).items.length === 2
  );
  assert(
    queryIncomeListItems(items, '', {
      ...defaultIncomeListFilters,
      currency: 'EUR',
    }).items.length === 1
  );
  assert(
    queryIncomeListItems(items, '', {
      ...defaultIncomeListFilters,
      billingType: 'HOURLY',
    }).items.length === 1
  );
  assert(
    queryIncomeListItems(items, '', {
      vatRate: '23',
      currency: 'PLN',
      billingType: 'MONTHLY',
    }).items.length === 1
  );
}

export function testIncomeListQueryKeepsStableDescendingOrder(): void {
  const result = queryIncomeListItems(createItems(), '', defaultIncomeListFilters);

  assert(result.items[0]?.id === 'c');
  assert(result.items[1]?.id === 'b');
  assert(result.items[2]?.id === 'a');
}

export function testIncomeListQueryReportsAppliedFiltersAndVisibility(): void {
  const filters: IncomeListFilters = {
    vatRate: '23',
    currency: 'PLN',
    billingType: 'ALL',
  };

  const matching = queryIncomeListItems(createItems(), 'acme', filters);
  const hidden = queryIncomeListItems(createItems(), 'missing', filters);

  assert(getAppliedIncomeFilterCount(filters) === 2);
  assert(hasActiveIncomeListFilters(filters));
  assert(matching.hasAnyRecordsInPeriod);
  assert(matching.hasVisibleResults);
  assert(hidden.hasAnyRecordsInPeriod);
  assert(!hidden.hasVisibleResults);
}

function createItems(): IncomeListItemViewModel[] {
  return [
    {
      id: 'a',
      title: 'Monthly Retainer',
      metadata: 'Acme Corp · FV/03/2026',
      amount: 12000,
      currency: 'PLN',
      vatRate: '23',
      vatLabel: 'VAT 23%',
      billingType: 'MONTHLY',
      billingTypeLabel: 'Miesięcznie',
      createdAt: '2026-03-02T08:00:00.000Z',
      searchableText: 'Monthly Retainer Premium support Acme Corp FV/03/2026 Acme Corp · FV/03/2026',
      warnings: [],
    },
    {
      id: 'b',
      title: 'Design Sprint',
      metadata: 'Nebula Ltd. · INV-44',
      amount: 9500,
      currency: 'EUR',
      vatRate: '8',
      vatLabel: 'VAT 8%',
      billingType: 'HOURLY',
      billingTypeLabel: 'Godzinowo',
      createdAt: '2026-03-08T10:00:00.000Z',
      searchableText: 'Design Sprint Workshop Nebula Ltd. INV-44 Nebula Ltd. · INV-44',
      warnings: [],
    },
    {
      id: 'c',
      title: 'Platform Delivery',
      metadata: 'Roadmap phase',
      amount: 18000,
      currency: 'PLN',
      vatRate: '23',
      vatLabel: 'VAT 23%',
      billingType: 'DAILY',
      billingTypeLabel: 'Dziennie',
      createdAt: '2026-03-08T10:00:00.000Z',
      searchableText: 'Platform Delivery Roadmap phase Fintech Horizon FIN-55 Roadmap phase',
      warnings: [],
    },
  ];
}

function assert(condition: unknown): asserts condition {
  if (!condition) {
    throw new Error('Assertion failed.');
  }
}
