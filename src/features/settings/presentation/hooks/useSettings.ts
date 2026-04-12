import { useMemo } from 'react';

import { useCalculatorData } from '@/features/calculator/presentation/hooks/useManagedCalculatorData';
import { LocalStorageSettingsRepository } from '@/features/settings/infrastructure/repositories/LocalStorageSettingsRepository';

import { useManagedSettings } from './useManagedSettings';

export function useSettings() {
  const repository = useMemo(() => new LocalStorageSettingsRepository(), []);
  const { resetCalculatorData, syncAllPeriodsWithCurrentSettings } = useCalculatorData();

  return useManagedSettings(repository, {
    onSettingsSaved: syncAllPeriodsWithCurrentSettings,
    onSettingsCleared: resetCalculatorData,
  });
}
