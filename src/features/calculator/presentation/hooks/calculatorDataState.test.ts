import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import { createMonthlyReportingPeriod } from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';

import {
  getSelectedPeriodLabel,
  hasBundleForSelectedPeriod,
  resolveIncomesScreenContentState,
} from './calculatorDataState';

export function testHasBundleForSelectedPeriodOnlyMatchesLoadedMonth(): void {
  const april = createMonthlyReportingPeriod(2026, 4);
  const may = createMonthlyReportingPeriod(2026, 5);
  const bundle = {} as ReportingPeriodBundle;

  assert(hasBundleForSelectedPeriod(bundle, april, april), 'April bundle should match April selection.');
  assert(
    !hasBundleForSelectedPeriod(bundle, april, may),
    'April bundle must not be treated as May data.'
  );
  assert(
    !hasBundleForSelectedPeriod(null, april, april),
    'Missing bundle must not be treated as a loaded period.'
  );
}

export function testResolveIncomesScreenContentStatePrioritizesLoadingAndError(): void {
  assert(
    resolveIncomesScreenContentState({
      isLoading: true,
      error: null,
      hasLoadedSelectedPeriod: false,
      itemCount: 0,
    }) === 'loading',
    'Loading selected period should render loading state.'
  );

  assert(
    resolveIncomesScreenContentState({
      isLoading: false,
      error: 'Boom',
      hasLoadedSelectedPeriod: false,
      itemCount: 0,
    }) === 'error',
    'Failed load for the selected period should render error state.'
  );
}

export function testResolveIncomesScreenContentStateSeparatesEmptyAndList(): void {
  assert(
    resolveIncomesScreenContentState({
      isLoading: false,
      error: null,
      hasLoadedSelectedPeriod: true,
      itemCount: 0,
    }) === 'empty',
    'Loaded month without records should render empty state.'
  );

  assert(
    resolveIncomesScreenContentState({
      isLoading: false,
      error: null,
      hasLoadedSelectedPeriod: true,
      itemCount: 2,
    }) === 'list',
    'Loaded month with records should render list state.'
  );
}

export function testGetSelectedPeriodLabelUsesSelectedMonth(): void {
  const label = getSelectedPeriodLabel(createMonthlyReportingPeriod(2026, 5));

  assert(label.toLocaleLowerCase('pl-PL').includes('2026'), 'Selected period label should include the year.');
  assert(
    label.toLocaleLowerCase('pl-PL').includes('maj'),
    'Selected period label should reflect the active month.'
  );
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
