import React, { useMemo } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { createDrizzleDb } from '@/core/database/client';
import { NbpExchangeRateProvider } from '@/features/calculator/infrastructure/services/NbpExchangeRateProvider';
import { SQLiteCalculatorRepository } from '@/features/calculator/infrastructure/repositories/SQLiteCalculatorRepository';
import { SQLiteSettingsRepository } from '@/features/settings/infrastructure/repositories/SQLiteSettingsRepository';

import { ManagedCalculatorDataProvider } from './useManagedCalculatorData';

type CalculatorDataProviderProps = {
  children: React.ReactNode;
};

export function CalculatorDataProvider({ children }: CalculatorDataProviderProps) {
  const sqlite = useSQLiteContext();
  const database = useMemo(() => createDrizzleDb(sqlite), [sqlite]);
  const calculatorRepository = useMemo(() => new SQLiteCalculatorRepository(database), [database]);
  const settingsRepository = useMemo(() => new SQLiteSettingsRepository(database), [database]);
  const exchangeRateProvider = useMemo(() => new NbpExchangeRateProvider(), []);

  return (
    <ManagedCalculatorDataProvider
      calculatorRepository={calculatorRepository}
      exchangeRateProvider={exchangeRateProvider}
      settingsRepository={settingsRepository}
    >
      {children}
    </ManagedCalculatorDataProvider>
  );
}
