import { eq } from 'drizzle-orm';

import { settingsTable } from '@/core/database/schema';
import type { DrizzleDatabase } from '@/core/database/client';
import {
  APP_SETTINGS_ID,
  type AppSettings,
  type SettingsPatch,
  applySettingsPatch,
  createDefaultAppSettings,
  sanitizeSettings,
  withUpdatedTimestamp,
} from '@/features/settings/domain/entities/app-settings';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';
import {
  fromSettingsRecord,
  toSettingsRecord,
} from '@/features/settings/infrastructure/mappers/settingsRecordMapper';

export class SQLiteSettingsRepository implements SettingsRepository {
  constructor(private readonly database: DrizzleDatabase) {}

  async getSettings(): Promise<AppSettings> {
    const existing = await this.database.query.settingsTable.findFirst({
      where: eq(settingsTable.id, APP_SETTINGS_ID),
    });

    if (!existing) {
      const defaults = createDefaultAppSettings();
      return this.saveSettings(defaults);
    }

    return fromSettingsRecord(existing);
  }

  async saveSettings(next: AppSettings): Promise<AppSettings> {
    const existing = await this.database.query.settingsTable.findFirst({
      where: eq(settingsTable.id, APP_SETTINGS_ID),
    });

    const prepared = withUpdatedTimestamp(
      sanitizeSettings({
        ...next,
        id: APP_SETTINGS_ID,
        createdAt: existing?.createdAt ?? next.createdAt,
      })
    );

    await this.database
      .insert(settingsTable)
      .values(toSettingsRecord(prepared))
      .onConflictDoUpdate({
        target: settingsTable.id,
        set: {
          version: prepared.version,
          payload: toSettingsRecord(prepared).payload,
          updatedAt: prepared.updatedAt,
        },
      });

    return prepared;
  }

  async updateSettings(patch: SettingsPatch): Promise<AppSettings> {
    const current = await this.getSettings();
    const next = applySettingsPatch(current, patch);

    return this.saveSettings(next);
  }

  async clearSettings(): Promise<void> {
    await this.database.delete(settingsTable).where(eq(settingsTable.id, APP_SETTINGS_ID));
  }
}
