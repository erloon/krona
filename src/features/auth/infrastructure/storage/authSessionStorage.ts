import { Platform } from 'react-native';

import type { StoredAuthSession } from '@/features/auth/shared/types/auth';

const AUTH_SESSION_STORAGE_KEY = 'auth.session';
let inMemorySessionValue: string | null = null;

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

  const secureStore = getSecureStoreModule();

  if (!secureStore) {
    return inMemorySessionValue;
  }

  return secureStore.getItemAsync(AUTH_SESSION_STORAGE_KEY);
}

async function writeStoredValue(value: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(AUTH_SESSION_STORAGE_KEY, value);
    return;
  }

  const secureStore = getSecureStoreModule();

  if (!secureStore) {
    inMemorySessionValue = value;
    return;
  }

  await secureStore.setItemAsync(AUTH_SESSION_STORAGE_KEY, value);
}

async function deleteStoredValue() {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(AUTH_SESSION_STORAGE_KEY);
    return;
  }

  const secureStore = getSecureStoreModule();

  if (!secureStore) {
    inMemorySessionValue = null;
    return;
  }

  await secureStore.deleteItemAsync(AUTH_SESSION_STORAGE_KEY);
}

type SecureStoreModule = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

function getSecureStoreModule(): SecureStoreModule | null {
  try {
    // Lazy load so the app can boot even if the installed binary lacks this native module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-secure-store') as SecureStoreModule;
  } catch {
    return null;
  }
}
