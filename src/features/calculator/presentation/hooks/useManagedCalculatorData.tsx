import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ensureReportingPeriodUseCase } from '@/features/calculator/application/use-cases/ensureReportingPeriod';
import { getReportingPeriodBundleUseCase } from '@/features/calculator/application/use-cases/getReportingPeriodBundle';
import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';
import {
  getNextMonthlyReportingPeriod,
  getPreviousMonthlyReportingPeriod,
  monthlyReportingPeriodFromDate,
  type MonthlyReportingPeriod,
} from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';

type CalculatorDataContextValue = {
  selectedPeriod: MonthlyReportingPeriod;
  bundle: ReportingPeriodBundle | null;
  isLoading: boolean;
  error: string | null;
  goToNextPeriod: () => void;
  goToPreviousPeriod: () => void;
  reload: () => Promise<void>;
};

const CalculatorDataContext = createContext<CalculatorDataContextValue | null>(null);

type ManagedCalculatorDataProviderProps = {
  children: React.ReactNode;
  calculatorRepository: CalculatorRepository;
  settingsRepository: SettingsRepository;
};

export function ManagedCalculatorDataProvider({
  children,
  calculatorRepository,
  settingsRepository,
}: ManagedCalculatorDataProviderProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<MonthlyReportingPeriod>(() =>
    monthlyReportingPeriodFromDate(new Date())
  );
  const [bundle, setBundle] = useState<ReportingPeriodBundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBundle = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await ensureReportingPeriodUseCase(calculatorRepository, settingsRepository, selectedPeriod);
      const nextBundle = await getReportingPeriodBundleUseCase(calculatorRepository, selectedPeriod);
      setBundle(nextBundle);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : 'Nie udało się wczytać danych dla wybranego okresu.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [calculatorRepository, selectedPeriod, settingsRepository]);

  useEffect(() => {
    void loadBundle();
  }, [loadBundle]);

  const value = useMemo<CalculatorDataContextValue>(
    () => ({
      selectedPeriod,
      bundle,
      isLoading,
      error,
      goToNextPeriod: () => setSelectedPeriod((current) => getNextMonthlyReportingPeriod(current)),
      goToPreviousPeriod: () =>
        setSelectedPeriod((current) => getPreviousMonthlyReportingPeriod(current)),
      reload: loadBundle,
    }),
    [bundle, error, isLoading, loadBundle, selectedPeriod]
  );

  return <CalculatorDataContext.Provider value={value}>{children}</CalculatorDataContext.Provider>;
}

export function useCalculatorData() {
  const context = useContext(CalculatorDataContext);

  if (!context) {
    throw new Error('useCalculatorData must be used within CalculatorDataProvider.');
  }

  return context;
}
