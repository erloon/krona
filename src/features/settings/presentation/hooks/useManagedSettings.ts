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

type UseManagedSettingsOptions = {
  onSettingsSaved?: (settings: AppSettings) => Promise<void> | void;
  onSettingsCleared?: () => Promise<void> | void;
};

export function useManagedSettings(
  repository: SettingsRepository,
  options: UseManagedSettingsOptions = {}
) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearingData, setIsClearingData] = useState(false);
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

  const clearDatabase = useCallback(async () => {
    latestRequestIdRef.current += 1;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    setError(null);
    setIsClearingData(true);

    try {
      await repository.clearSettings();
      await options.onSettingsCleared?.();
      await loadSettings();
      setSaveState('saved');
    } catch (clearError) {
      const message =
        clearError instanceof Error ? clearError.message : 'Nie udało się wyczyścić danych.';
      setError(message);
      setSaveState('error');
      throw clearError;
    } finally {
      setIsClearingData(false);
    }
  }, [loadSettings, options, repository]);

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
              try {
                await options.onSettingsSaved?.(saved);
              } catch (syncError) {
                const message =
                  syncError instanceof Error
                    ? syncError.message
                    : 'Zapisano ustawienia, ale nie udało się przeliczyć danych.';

                setError(message);
                setSaveState('error');
                return;
              }

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
    [options, repository]
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
    isClearingData,
    reload: loadSettings,
    updateSettings,
    clearDatabase,
  };
}
