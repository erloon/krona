import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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

import { hasBundleForSelectedPeriod } from './calculatorDataState';

type CalculatorDataContextValue = {
  selectedPeriod: MonthlyReportingPeriod;
  loadedPeriod: MonthlyReportingPeriod | null;
  bundle: ReportingPeriodBundle | null;
  hasLoadedSelectedPeriod: boolean;
  hasAnyRecordsEver: boolean;
  isLoading: boolean;
  error: string | null;
  goToNextPeriod: () => void;
  goToPreviousPeriod: () => void;
  selectPeriod: (period: MonthlyReportingPeriod) => void;
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
  const [loadedPeriod, setLoadedPeriod] = useState<MonthlyReportingPeriod | null>(null);
  const [bundle, setBundle] = useState<ReportingPeriodBundle | null>(null);
  const [hasAnyRecordsEver, setHasAnyRecordsEver] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadSequenceRef = useRef(0);

  // Check if any income records exist in the entire database on initial load
  useEffect(() => {
    let isCancelled = false;

    const checkAnyRecordsEver = async () => {
      try {
        const anyRecords = await calculatorRepository.hasAnyIncomes();
        if (!isCancelled) {
          setHasAnyRecordsEver(anyRecords);
        }
      } catch {
        // Ignore errors during this check, just keep as false
        if (!isCancelled) {
          setHasAnyRecordsEver(false);
        }
      }
    };

    checkAnyRecordsEver();

    return () => {
      isCancelled = true;
    };
  }, [calculatorRepository]);

  const loadBundle = useCallback(async (period = selectedPeriod) => {
    const requestId = ++loadSequenceRef.current;

    try {
      setIsLoading(true);
      setError(null);
      const nextBundle = await loadIncomesForPeriodUseCase(
        calculatorRepository,
        settingsRepository,
        period
      );

      if (requestId !== loadSequenceRef.current) {
        return;
      }

      setBundle(nextBundle);
      setLoadedPeriod(period);

      // Update hasAnyRecordsEver if we now have any records
      if (!hasAnyRecordsEver && nextBundle.incomes.length > 0) {
        setHasAnyRecordsEver(true);
      }
    } catch (loadError) {
      if (requestId !== loadSequenceRef.current) {
        return;
      }

      const message =
        loadError instanceof Error
          ? loadError.message
          : 'Nie udało się wczytać danych dla wybranego okresu.';
      setError(message);
    } finally {
      if (requestId === loadSequenceRef.current) {
        setIsLoading(false);
      }
    }
  }, [calculatorRepository, hasAnyRecordsEver, selectedPeriod, settingsRepository]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
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
      setLoadedPeriod(selectedPeriod);
      setHasAnyRecordsEver(true); // We've now created an income record, so set to true
      setError(null);
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
      setLoadedPeriod(selectedPeriod);
      setHasAnyRecordsEver(true); // Make sure it stays true if it's already true
      setError(null);
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
      setLoadedPeriod(selectedPeriod);
      setHasAnyRecordsEver(true); // Make sure it stays true if it's already true
      setError(null);
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
      setLoadedPeriod(selectedPeriod);
      // Update hasAnyRecordsEver if we need to check if database is now empty
      if (nextBundle.incomes.length === 0) {
        const anyRecords = await calculatorRepository.hasAnyIncomes();
        setHasAnyRecordsEver(anyRecords);
      }
      setError(null);
    },
    [calculatorRepository, selectedPeriod, settingsRepository]
  );

  const hasLoadedSelectedPeriod = hasBundleForSelectedPeriod(bundle, loadedPeriod, selectedPeriod);

  const value = useMemo<CalculatorDataContextValue>(
    () => ({
      selectedPeriod,
      loadedPeriod,
      bundle,
      hasLoadedSelectedPeriod,
      hasAnyRecordsEver,
      isLoading,
      error,
      goToNextPeriod: () => setSelectedPeriod((current) => getNextMonthlyReportingPeriod(current)),
      goToPreviousPeriod: () =>
        setSelectedPeriod((current) => getPreviousMonthlyReportingPeriod(current)),
      selectPeriod: (period) => setSelectedPeriod(period),
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
      hasLoadedSelectedPeriod,
      hasAnyRecordsEver,
      isLoading,
      loadedPeriod,
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
