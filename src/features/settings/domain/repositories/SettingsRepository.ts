import type { AppSettings, SettingsPatch } from '@/features/settings/domain/entities/app-settings';

export interface SettingsRepository {
  getSettings(): Promise<AppSettings>;
  saveSettings(next: AppSettings): Promise<AppSettings>;
  updateSettings(patch: SettingsPatch): Promise<AppSettings>;
  clearSettings(): Promise<void>;
}
