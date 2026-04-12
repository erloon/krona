import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { createCostForPeriodUseCase } from '@/features/calculator/application/use-cases/createCostForPeriod';
import { deleteCostFromPeriodUseCase } from '@/features/calculator/application/use-cases/deleteCostFromPeriod';
import { duplicateCostInPeriodUseCase } from '@/features/calculator/application/use-cases/duplicateCostInPeriod';
import type { CostEditorInput } from '@/features/calculator/application/use-cases/costCommands';
import { createIncomeForPeriodUseCase } from '@/features/calculator/application/use-cases/createIncomeForPeriod';
import { deleteIncomeFromPeriodUseCase } from '@/features/calculator/application/use-cases/deleteIncomeFromPeriod';
import { duplicateIncomeInPeriodUseCase } from '@/features/calculator/application/use-cases/duplicateIncomeInPeriod';
import type { IncomeEditorInput } from '@/features/calculator/application/use-cases/incomeCommands';
import { loadIncomesForPeriodUseCase } from '@/features/calculator/application/use-cases/loadIncomesForPeriod';
import { syncAllReportingPeriodsWithSettingsUseCase } from '@/features/calculator/application/use-cases/syncAllReportingPeriodsWithSettings';
import { updateCostForPeriodUseCase } from '@/features/calculator/application/use-cases/updateCostForPeriod';
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
  hasAnyCostsEver: boolean;
  isLoading: boolean;
  error: string | null;
  goToNextPeriod: () => void;
  goToPreviousPeriod: () => void;
  selectPeriod: (period: MonthlyReportingPeriod) => void;
  reloadSelectedPeriod: () => Promise<void>;
  syncAllPeriodsWithCurrentSettings: () => Promise<void>;
  resetCalculatorData: () => Promise<void>;
  createIncome: (input: IncomeEditorInput) => Promise<void>;
  updateIncome: (incomeId: string, input: IncomeEditorInput) => Promise<void>;
  duplicateIncome: (incomeId: string) => Promise<void>;
  deleteIncome: (incomeId: string) => Promise<void>;
  createCost: (input: CostEditorInput) => Promise<void>;
  updateCost: (costId: string, input: CostEditorInput) => Promise<void>;
  duplicateCost: (costId: string) => Promise<void>;
  deleteCost: (costId: string) => Promise<void>;
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
  const [hasAnyCostsEver, setHasAnyCostsEver] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadSequenceRef = useRef(0);
  const resetToCurrentMonth = useCallback(() => {
    loadSequenceRef.current += 1;
    setSelectedPeriod(monthlyReportingPeriodFromDate(new Date()));
    setLoadedPeriod(null);
    setBundle(null);
    setHasAnyRecordsEver(false);
    setHasAnyCostsEver(false);
    setError(null);
    setIsLoading(false);
  }, []);

  // Check if any income or cost records exist in the entire database on initial load.
  useEffect(() => {
    let isCancelled = false;

    const checkAnyRecordsEver = async () => {
      try {
        const [anyIncomeRecords, anyCostRecords] = await Promise.all([
          calculatorRepository.hasAnyIncomes(),
          calculatorRepository.hasAnyCosts(),
        ]);
        if (!isCancelled) {
          setHasAnyRecordsEver(anyIncomeRecords);
          setHasAnyCostsEver(anyCostRecords);
        }
      } catch {
        if (!isCancelled) {
          setHasAnyRecordsEver(false);
          setHasAnyCostsEver(false);
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

      if (!hasAnyRecordsEver && nextBundle.incomes.length > 0) {
        setHasAnyRecordsEver(true);
      }

      if (!hasAnyCostsEver && nextBundle.costs.length > 0) {
        setHasAnyCostsEver(true);
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
  }, [calculatorRepository, hasAnyCostsEver, hasAnyRecordsEver, selectedPeriod, settingsRepository]);

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
      setHasAnyRecordsEver(true);
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
      setHasAnyRecordsEver(true);
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
      setHasAnyRecordsEver(true);
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
      if (nextBundle.incomes.length === 0) {
        const anyRecords = await calculatorRepository.hasAnyIncomes();
        setHasAnyRecordsEver(anyRecords);
      }
      setError(null);
    },
    [calculatorRepository, selectedPeriod, settingsRepository]
  );

  const createCost = useCallback(
    async (input: CostEditorInput) => {
      const nextBundle = await createCostForPeriodUseCase(
        calculatorRepository,
        settingsRepository,
        {
          period: selectedPeriod,
          input,
        }
      );
      setBundle(nextBundle);
      setLoadedPeriod(selectedPeriod);
      setHasAnyCostsEver(true);
      setError(null);
    },
    [calculatorRepository, selectedPeriod, settingsRepository]
  );

  const updateCost = useCallback(
    async (costId: string, input: CostEditorInput) => {
      const nextBundle = await updateCostForPeriodUseCase(
        calculatorRepository,
        settingsRepository,
        {
          period: selectedPeriod,
          costId,
          input,
        }
      );
      setBundle(nextBundle);
      setLoadedPeriod(selectedPeriod);
      setHasAnyCostsEver(true);
      setError(null);
    },
    [calculatorRepository, selectedPeriod, settingsRepository]
  );

  const duplicateCost = useCallback(
    async (costId: string) => {
      const nextBundle = await duplicateCostInPeriodUseCase(
        calculatorRepository,
        settingsRepository,
        {
          period: selectedPeriod,
          costId,
        }
      );
      setBundle(nextBundle);
      setLoadedPeriod(selectedPeriod);
      setHasAnyCostsEver(true);
      setError(null);
    },
    [calculatorRepository, selectedPeriod, settingsRepository]
  );

  const deleteCost = useCallback(
    async (costId: string) => {
      const nextBundle = await deleteCostFromPeriodUseCase(
        calculatorRepository,
        settingsRepository,
        {
          period: selectedPeriod,
          costId,
        }
      );
      setBundle(nextBundle);
      setLoadedPeriod(selectedPeriod);
      if (nextBundle.costs.length === 0) {
        const anyCosts = await calculatorRepository.hasAnyCosts();
        setHasAnyCostsEver(anyCosts);
      }
      setError(null);
    },
    [calculatorRepository, selectedPeriod, settingsRepository]
  );

  const syncAllPeriodsWithCurrentSettings = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      await syncAllReportingPeriodsWithSettingsUseCase(calculatorRepository, settingsRepository);

      const [anyRecords, anyCosts] = await Promise.all([
        calculatorRepository.hasAnyIncomes(),
        calculatorRepository.hasAnyCosts(),
      ]);

      setHasAnyRecordsEver(anyRecords);
      setHasAnyCostsEver(anyCosts);
      await loadBundle(selectedPeriod);
    } catch (syncError) {
      const message =
        syncError instanceof Error
          ? syncError.message
          : 'Nie udało się przeliczyć danych dla zapisanych okresów.';
      setError(message);
      setIsLoading(false);
      throw syncError;
    }
  }, [calculatorRepository, loadBundle, selectedPeriod, settingsRepository]);

  const resetCalculatorData = useCallback(async () => {
    await calculatorRepository.clearAllData();
    resetToCurrentMonth();
  }, [calculatorRepository, resetToCurrentMonth]);

  const hasLoadedSelectedPeriod = hasBundleForSelectedPeriod(bundle, loadedPeriod, selectedPeriod);

  const value = useMemo<CalculatorDataContextValue>(
    () => ({
      selectedPeriod,
      loadedPeriod,
      bundle,
      hasLoadedSelectedPeriod,
      hasAnyRecordsEver,
      hasAnyCostsEver,
      isLoading,
      error,
      goToNextPeriod: () => setSelectedPeriod((current) => getNextMonthlyReportingPeriod(current)),
      goToPreviousPeriod: () =>
        setSelectedPeriod((current) => getPreviousMonthlyReportingPeriod(current)),
      selectPeriod: (period) => setSelectedPeriod(period),
      reloadSelectedPeriod: loadBundle,
      syncAllPeriodsWithCurrentSettings,
      resetCalculatorData,
      createIncome,
      updateIncome,
      duplicateIncome,
      deleteIncome,
      createCost,
      updateCost,
      duplicateCost,
      deleteCost,
    }),
    [
      bundle,
      createCost,
      createIncome,
      deleteCost,
      deleteIncome,
      duplicateCost,
      duplicateIncome,
      error,
      hasAnyCostsEver,
      hasLoadedSelectedPeriod,
      hasAnyRecordsEver,
      isLoading,
      loadedPeriod,
      loadBundle,
      selectedPeriod,
      syncAllPeriodsWithCurrentSettings,
      resetCalculatorData,
      updateCost,
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
