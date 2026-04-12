import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import {
  isSameMonthlyReportingPeriod,
  toMonthlyReportingPeriodLabel,
  type MonthlyReportingPeriod,
} from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';

type ResolveIncomesScreenContentStateParams = {
  isLoading: boolean;
  error: string | null;
  hasLoadedSelectedPeriod: boolean;
  hasAnyRecordsInPeriod: boolean;
  hasVisibleResults: boolean;
  hasAnyRecordsEver: boolean;
};

export type IncomesScreenContentState = 'loading' | 'error' | 'list' | 'empty' | 'no-results' | 'first-use';
export type CostsScreenContentState = 'loading' | 'error' | 'list' | 'empty' | 'no-results' | 'first-use';

export function hasBundleForSelectedPeriod(
  bundle: ReportingPeriodBundle | null,
  loadedPeriod: MonthlyReportingPeriod | null,
  selectedPeriod: MonthlyReportingPeriod
): boolean {
  return (
    bundle !== null &&
    loadedPeriod !== null &&
    isSameMonthlyReportingPeriod(loadedPeriod, selectedPeriod)
  );
}

export function getSelectedPeriodLabel(period: MonthlyReportingPeriod) {
  return toMonthlyReportingPeriodLabel(period);
}

export function resolveIncomesScreenContentState({
  isLoading,
  error,
  hasLoadedSelectedPeriod,
  hasAnyRecordsInPeriod,
  hasVisibleResults,
  hasAnyRecordsEver,
}: ResolveIncomesScreenContentStateParams): IncomesScreenContentState {
  if (isLoading) {
    return 'loading';
  }

  if (error) {
    return 'error';
  }

  if (!hasLoadedSelectedPeriod) {
    return 'loading';
  }

  if (hasVisibleResults) {
    return 'list';
  }

  if (!hasAnyRecordsEver) {
    return 'first-use';
  }

  return hasAnyRecordsInPeriod ? 'no-results' : 'empty';
}

type ResolveCostsScreenContentStateParams = {
  isLoading: boolean;
  error: string | null;
  hasLoadedSelectedPeriod: boolean;
  hasAnyRecordsInPeriod: boolean;
  hasVisibleResults: boolean;
  hasAnyCostsEver: boolean;
};

export function resolveCostsScreenContentState({
  isLoading,
  error,
  hasLoadedSelectedPeriod,
  hasAnyRecordsInPeriod,
  hasVisibleResults,
  hasAnyCostsEver,
}: ResolveCostsScreenContentStateParams): CostsScreenContentState {
  if (isLoading) {
    return 'loading';
  }

  if (error) {
    return 'error';
  }

  if (!hasLoadedSelectedPeriod) {
    return 'loading';
  }

  if (hasVisibleResults) {
    return 'list';
  }

  if (!hasAnyCostsEver) {
    return 'first-use';
  }

  return hasAnyRecordsInPeriod ? 'no-results' : 'empty';
}
