import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { StoredAuthSession } from '@/features/auth/shared/types/auth';

const AUTH_SESSION_STORAGE_KEY = 'auth.session';

export const authSessionStorage = {
  async load() {
    const rawSession = await readStoredValue();

    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession) as StoredAuthSession;
    } catch {
      await authSessionStorage.clear();
      return null;
    }
  },
  async save(session: StoredAuthSession) {
    const serializedSession = JSON.stringify(session);
    await writeStoredValue(serializedSession);
  },
  async clear() {
    await deleteStoredValue();
  },
};

async function readStoredValue() {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(AUTH_SESSION_STORAGE_KEY) ?? null;
  }

  return SecureStore.getItemAsync(AUTH_SESSION_STORAGE_KEY);
}

async function writeStoredValue(value: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(AUTH_SESSION_STORAGE_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(AUTH_SESSION_STORAGE_KEY, value);
}

async function deleteStoredValue() {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(AUTH_SESSION_STORAGE_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_SESSION_STORAGE_KEY);
}
