import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createIncomeForPeriodUseCase } from '@/features/calculator/application/use-cases/createIncomeForPeriod';
import { deleteIncomeFromPeriodUseCase } from '@/features/calculator/application/use-cases/deleteIncomeFromPeriod';
import { duplicateIncomeInPeriodUseCase } from '@/features/calculator/application/use-cases/duplicateIncomeInPeriod';
import type { IncomeEditorInput } from '@/features/calculator/application/use-cases/incomeCommands';
import { loadIncomesForPeriodUseCase } from '@/features/calculator/application/use-cases/loadIncomesForPeriod';
import { updateIncomeForPeriodUseCase } from '@/features/calculator/application/use-cases/updateIncomeForPeriod';
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
  reloadSelectedPeriod: () => Promise<void>;
  createIncome: (input: IncomeEditorInput) => Promise<void>;
  updateIncome: (incomeId: string, input: IncomeEditorInput) => Promise<void>;
  duplicateIncome: (incomeId: string) => Promise<void>;
  deleteIncome: (incomeId: string) => Promise<void>;
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
      const nextBundle = await loadIncomesForPeriodUseCase(
        calculatorRepository,
        settingsRepository,
        selectedPeriod
      );
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

  const createIncome = useCallback(
    async (input: IncomeEditorInput) => {
      const nextBundle = await createIncomeForPeriodUseCase(
        calculatorRepository,
        settingsRepository,
        {
          period: selectedPeriod,
          input,
        }
      );
      setBundle(nextBundle);
    },
    [calculatorRepository, selectedPeriod, settingsRepository]
  );

  const updateIncome = useCallback(
    async (incomeId: string, input: IncomeEditorInput) => {
      const nextBundle = await updateIncomeForPeriodUseCase(
        calculatorRepository,
        settingsRepository,
        {
          period: selectedPeriod,
          incomeId,
          input,
        }
      );
      setBundle(nextBundle);
    },
    [calculatorRepository, selectedPeriod, settingsRepository]
  );

  const duplicateIncome = useCallback(
    async (incomeId: string) => {
      const nextBundle = await duplicateIncomeInPeriodUseCase(
        calculatorRepository,
        settingsRepository,
        {
          period: selectedPeriod,
          incomeId,
        }
      );
      setBundle(nextBundle);
    },
    [calculatorRepository, selectedPeriod, settingsRepository]
  );

  const deleteIncome = useCallback(
    async (incomeId: string) => {
      const nextBundle = await deleteIncomeFromPeriodUseCase(
        calculatorRepository,
        settingsRepository,
        {
          period: selectedPeriod,
          incomeId,
        }
      );
      setBundle(nextBundle);
    },
    [calculatorRepository, selectedPeriod, settingsRepository]
  );

  const value = useMemo<CalculatorDataContextValue>(
    () => ({
      selectedPeriod,
      bundle,
      isLoading,
      error,
      goToNextPeriod: () => setSelectedPeriod((current) => getNextMonthlyReportingPeriod(current)),
      goToPreviousPeriod: () =>
        setSelectedPeriod((current) => getPreviousMonthlyReportingPeriod(current)),
      reloadSelectedPeriod: loadBundle,
      createIncome,
      updateIncome,
      duplicateIncome,
      deleteIncome,
    }),
    [
      bundle,
      createIncome,
      deleteIncome,
      duplicateIncome,
      error,
      isLoading,
      loadBundle,
      selectedPeriod,
      updateIncome,
    ]
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
