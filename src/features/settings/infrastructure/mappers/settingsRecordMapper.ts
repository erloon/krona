import { eq } from 'drizzle-orm';

import { settingsTable } from '@/core/database/schema';
import {
  APP_SETTINGS_ID,
  APP_SETTINGS_VERSION,
  type AppSettings,
  createDefaultAppSettings,
  sanitizeSettings,
} from '@/features/settings/domain/entities/app-settings';

type SettingsRecord = typeof settingsTable.$inferSelect;
type SettingsInsertRecord = typeof settingsTable.$inferInsert;

type PersistedSettingsPayload = Omit<AppSettings, 'id' | 'version' | 'createdAt' | 'updatedAt'>;

export function toSettingsRecord(settings: AppSettings): SettingsInsertRecord {
  const sanitized = sanitizeSettings(settings);

  return {
    id: sanitized.id,
    version: APP_SETTINGS_VERSION,
    payload: JSON.stringify({
      profile: sanitized.profile,
      tax: sanitized.tax,
      zus: sanitized.zus,
      reliefs: sanitized.reliefs,
      vat: sanitized.vat,
      preferences: sanitized.preferences,
    } satisfies PersistedSettingsPayload),
    createdAt: sanitized.createdAt,
    updatedAt: sanitized.updatedAt,
  };
}

export function fromSettingsRecord(record: SettingsRecord): AppSettings {
  const defaults = createDefaultAppSettings(record.createdAt);
  const parsed = JSON.parse(record.payload) as Partial<PersistedSettingsPayload>;

  return sanitizeSettings({
    ...defaults,
    id: record.id ?? APP_SETTINGS_ID,
    version: record.version ?? APP_SETTINGS_VERSION,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    profile: {
      ...defaults.profile,
      ...parsed.profile,
    },
    tax: {
      ...defaults.tax,
      ...parsed.tax,
    },
    zus: {
      ...defaults.zus,
      ...parsed.zus,
    },
    reliefs: {
      ...defaults.reliefs,
      ...parsed.reliefs,
    },
    vat: {
      ...defaults.vat,
      ...parsed.vat,
    },
    preferences: {
      ...defaults.preferences,
      ...parsed.preferences,
    },
  });
}

export function singletonSettingsWhere() {
  return eq(settingsTable.id, APP_SETTINGS_ID);
}
