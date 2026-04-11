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
      hasAnyRecordsInPeriod: false,
      hasVisibleResults: false,
      hasAnyRecordsEver: false,
    }) === 'loading',
    'Loading selected period should render loading state.'
  );

  assert(
    resolveIncomesScreenContentState({
      isLoading: false,
      error: 'Boom',
      hasLoadedSelectedPeriod: false,
      hasAnyRecordsInPeriod: false,
      hasVisibleResults: false,
      hasAnyRecordsEver: false,
    }) === 'error',
    'Failed load for the selected period should render error state.'
  );
}

export function testResolveIncomesScreenContentStateSeparatesEmptyAndList(): void {
  // First-use state: no records ever in the entire database
  assert(
    resolveIncomesScreenContentState({
      isLoading: false,
      error: null,
      hasLoadedSelectedPeriod: true,
      hasAnyRecordsInPeriod: false,
      hasVisibleResults: false,
      hasAnyRecordsEver: false,
    }) === 'first-use',
    'First time user with no records anywhere should render first-use state.'
  );

  // Empty state: current month empty but other months have data
  assert(
    resolveIncomesScreenContentState({
      isLoading: false,
      error: null,
      hasLoadedSelectedPeriod: true,
      hasAnyRecordsInPeriod: false,
      hasVisibleResults: false,
      hasAnyRecordsEver: true,
    }) === 'empty',
    'Loaded month without records but other months have data should render empty state.'
  );

  assert(
    resolveIncomesScreenContentState({
      isLoading: false,
      error: null,
      hasLoadedSelectedPeriod: true,
      hasAnyRecordsInPeriod: true,
      hasVisibleResults: true,
      hasAnyRecordsEver: true,
    }) === 'list',
    'Loaded month with records should render list state.'
  );

  assert(
    resolveIncomesScreenContentState({
      isLoading: false,
      error: null,
      hasLoadedSelectedPeriod: true,
      hasAnyRecordsInPeriod: true,
      hasVisibleResults: false,
      hasAnyRecordsEver: true,
    }) === 'no-results',
    'Loaded month with hidden records should render a no-results state.'
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
