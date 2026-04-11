import { useMemo } from 'react';

import { LocalStorageSettingsRepository } from '@/features/settings/infrastructure/repositories/LocalStorageSettingsRepository';

import { useManagedSettings } from './useManagedSettings';

export function useSettings() {
  const repository = useMemo(() => new LocalStorageSettingsRepository(), []);

  return useManagedSettings(repository);
}
