import React, { useMemo } from 'react';

import { LocalStorageCalculatorRepository } from '@/features/calculator/infrastructure/repositories/LocalStorageCalculatorRepository';
import { LocalStorageSettingsRepository } from '@/features/settings/infrastructure/repositories/LocalStorageSettingsRepository';

import { ManagedCalculatorDataProvider } from './useManagedCalculatorData';

type CalculatorDataProviderProps = {
  children: React.ReactNode;
};

export function CalculatorDataProvider({ children }: CalculatorDataProviderProps) {
  const calculatorRepository = useMemo(() => new LocalStorageCalculatorRepository(), []);
  const settingsRepository = useMemo(() => new LocalStorageSettingsRepository(), []);

  return (
    <ManagedCalculatorDataProvider
      calculatorRepository={calculatorRepository}
      settingsRepository={settingsRepository}
    >
      {children}
    </ManagedCalculatorDataProvider>
  );
}
