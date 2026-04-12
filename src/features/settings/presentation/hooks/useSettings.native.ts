import { useMemo } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { createDrizzleDb } from '@/core/database/client';
import { useCalculatorData } from '@/features/calculator/presentation/hooks/useManagedCalculatorData';
import { SQLiteSettingsRepository } from '@/features/settings/infrastructure/repositories/SQLiteSettingsRepository';

import { useManagedSettings } from './useManagedSettings';

export function useSettings() {
  const sqlite = useSQLiteContext();
  const { resetCalculatorData, syncAllPeriodsWithCurrentSettings } = useCalculatorData();
  const repository = useMemo(
    () => new SQLiteSettingsRepository(createDrizzleDb(sqlite)),
    [sqlite]
  );

  return useManagedSettings(repository, {
    onSettingsSaved: syncAllPeriodsWithCurrentSettings,
    onSettingsCleared: resetCalculatorData,
  });
}
