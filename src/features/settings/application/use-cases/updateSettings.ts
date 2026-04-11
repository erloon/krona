import type {
  AppSettings,
  SettingsPatch,
} from '@/features/settings/domain/entities/app-settings';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';

export async function updateSettingsUseCase(
  repository: SettingsRepository,
  patch: SettingsPatch
): Promise<AppSettings> {
  return repository.updateSettings(patch);
}

export async function saveSettingsUseCase(
  repository: SettingsRepository,
  next: AppSettings
): Promise<AppSettings> {
  return repository.saveSettings(next);
}
