import type { AppSettings } from '@/features/settings/domain/entities/app-settings';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';

export async function getSettingsUseCase(repository: SettingsRepository): Promise<AppSettings> {
  return repository.getSettings();
}
