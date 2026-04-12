import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';
import type {
  AppSettings,
  SettingsPatch,
} from '@/features/settings/domain/entities/app-settings';
import {
  APP_SETTINGS_ID,
  applySettingsPatch,
  createDefaultAppSettings,
  sanitizeSettings,
  withUpdatedTimestamp,
} from '@/features/settings/domain/entities/app-settings';

const STORAGE_KEY = 'krona.app-settings';

export class LocalStorageSettingsRepository implements SettingsRepository {
  async getSettings(): Promise<AppSettings> {
    const storage = getStorage();
    const rawValue = storage?.getItem(STORAGE_KEY);

    if (!rawValue) {
      const defaults = createDefaultAppSettings();
      return this.saveSettings(defaults);
    }

    try {
      const parsed = JSON.parse(rawValue) as AppSettings;

      return sanitizeSettings({
        ...createDefaultAppSettings(parsed.createdAt),
        ...parsed,
        id: APP_SETTINGS_ID,
      });
    } catch {
      const defaults = createDefaultAppSettings();
      return this.saveSettings(defaults);
    }
  }

  async saveSettings(next: AppSettings): Promise<AppSettings> {
    const storage = getStorage();
    const prepared = withUpdatedTimestamp(
      sanitizeSettings({
        ...next,
        id: APP_SETTINGS_ID,
      })
    );

    storage?.setItem(STORAGE_KEY, JSON.stringify(prepared));

    return prepared;
  }

  async updateSettings(patch: SettingsPatch): Promise<AppSettings> {
    const current = await this.getSettings();
    return this.saveSettings(applySettingsPatch(current, patch));
  }

  async clearSettings(): Promise<void> {
    const storage = getStorage();
    storage?.removeItem(STORAGE_KEY);
  }
}

function getStorage() {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  return globalThis.localStorage;
}
