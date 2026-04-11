import { useCallback, useEffect, useRef, useState } from 'react';

import { getSettingsUseCase } from '@/features/settings/application/use-cases/getSettings';
import { saveSettingsUseCase } from '@/features/settings/application/use-cases/updateSettings';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';
import type {
  AppSettings,
  SettingsPatch,
} from '@/features/settings/domain/entities/app-settings';
import { applySettingsPatch } from '@/features/settings/domain/entities/app-settings';

type SaveMode = 'debounced' | 'immediate';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const TEXT_INPUT_DEBOUNCE_MS = 450;

export function useManagedSettings(repository: SettingsRepository) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const latestRequestIdRef = useRef(0);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const initialSettings = await getSettingsUseCase(repository);
      setSettings(initialSettings);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Nie udało się wczytać ustawień.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const enqueueSave = useCallback(
    (nextSettings: AppSettings) => {
      const requestId = ++latestRequestIdRef.current;
      setSaveState('saving');

      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          try {
            const saved = await saveSettingsUseCase(repository, nextSettings);

            if (requestId === latestRequestIdRef.current) {
              setSettings(saved);
              setSaveState('saved');
            }
          } catch (saveError) {
            const message =
              saveError instanceof Error
                ? saveError.message
                : 'Nie udało się zapisać ustawień.';

            if (requestId === latestRequestIdRef.current) {
              setError(message);
              setSaveState('error');
            }
          }
        });
    },
    [repository]
  );

  const updateSettings = useCallback(
    (patch: SettingsPatch, mode: SaveMode = 'immediate') => {
      setSettings((currentSettings) => {
        if (!currentSettings) {
          return currentSettings;
        }

        const nextSettings = applySettingsPatch(currentSettings, patch);
        setError(null);

        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
          debounceTimeoutRef.current = null;
        }

        if (mode === 'debounced') {
          debounceTimeoutRef.current = setTimeout(() => {
            enqueueSave(nextSettings);
          }, TEXT_INPUT_DEBOUNCE_MS);
        } else {
          enqueueSave(nextSettings);
        }

        return nextSettings;
      });
    },
    [enqueueSave]
  );

  return {
    settings,
    isLoading,
    error,
    saveState,
    reload: loadSettings,
    updateSettings,
  };
}
