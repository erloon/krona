import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import {
  aesDecryptAsync,
  AESEncryptionKey,
  aesEncryptAsync,
  AESSealedData,
} from 'expo-crypto/build/aes';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

import { DATABASE_NAME } from '@/core/database/client';
import { closeActiveDatabase } from '@/core/database/runtime';
import type { PinSecurityRecord, PinSetupResult } from '@/features/auth/shared/types/security';

const SECURITY_RECORD_STORAGE_KEY = 'security.pin.record.v1';
const DEVICE_SECRET_STORAGE_KEY = 'security.device.secret.v1';

type SecureStoreModule = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

type RuntimeSupport = {
  supported: boolean;
  message: string | null;
};

export const localSecurityService = {
  getRuntimeSupport(): RuntimeSupport {
    if (Platform.OS === 'web') {
      return {
        supported: false,
        message:
          'PIN i szyfrowanie bazy danych dzialaja tylko w natywnym buildzie Android/iOS.',
      };
    }

    if (Constants.appOwnership === 'expo') {
      return {
        supported: false,
        message:
          'PIN i szyfrowanie bazy danych nie sa obslugiwane w Expo Go. Uruchom dev client albo build preview.',
      };
    }

    if (!getSecureStoreModule()) {
      return {
        supported: false,
        message:
          'Ta wersja aplikacji nie zawiera natywnego modułu bezpiecznego przechowywania danych.',
      };
    }

    return {
      supported: true,
      message: null,
    };
  },
  async hasPin(userId: string) {
    const record = await readSecurityRecord();
    return record?.userId === userId;
  },
  async setupPin(userId: string, pin: string): Promise<PinSetupResult> {
    assertRuntimeSupported();
    assertPinFormat(pin);

    const deviceSecret = await ensureDeviceSecret();
    const saltHex = randomHex(16);
    const databaseKey = randomHex(32);
    const wrappingKey = await derivePinKey(userId, pin, saltHex, deviceSecret);
    const sealedDatabaseKey = await aesEncryptAsync(encodeText(databaseKey), wrappingKey, {
      additionalData: encodeText(userId),
    });

    const record: PinSecurityRecord = {
      version: 1,
      userId,
      saltHex,
      wrappedDatabaseKeyBase64: await sealedDatabaseKey.combined('base64'),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await writeSecurityRecord(record);

    return { databaseKey };
  },
  async unlockWithPin(userId: string, pin: string): Promise<PinSetupResult> {
    assertRuntimeSupported();
    assertPinFormat(pin);

    const record = await readSecurityRecord();

    if (!record || record.userId !== userId) {
      throw new Error('Najpierw ustaw PIN dla tego konta na tym urządzeniu.');
    }

    const deviceSecret = await ensureDeviceSecret();
    const wrappingKey = await derivePinKey(userId, pin, record.saltHex, deviceSecret);

    try {
      const sealedData = AESSealedData.fromCombined(record.wrappedDatabaseKeyBase64);
      const decrypted = await aesDecryptAsync(sealedData, wrappingKey, {
        additionalData: encodeText(userId),
      });

      return {
        databaseKey: decodeText(decrypted),
      };
    } catch {
      throw new Error('Nieprawidłowy PIN. Spróbuj ponownie.');
    }
  },
  async changePin(userId: string, currentPin: string, nextPin: string) {
    assertRuntimeSupported();
    assertPinFormat(currentPin);
    assertPinFormat(nextPin);

    const current = await localSecurityService.unlockWithPin(userId, currentPin);
    const deviceSecret = await ensureDeviceSecret();
    const saltHex = randomHex(16);
    const wrappingKey = await derivePinKey(userId, nextPin, saltHex, deviceSecret);
    const sealedDatabaseKey = await aesEncryptAsync(encodeText(current.databaseKey), wrappingKey, {
      additionalData: encodeText(userId),
    });

    const existing = await readSecurityRecord();
    const record: PinSecurityRecord = {
      version: 1,
      userId,
      saltHex,
      wrappedDatabaseKeyBase64: await sealedDatabaseKey.combined('base64'),
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    await writeSecurityRecord(record);
  },
  async resetSecureLocalData() {
    await closeActiveDatabase();
    await deleteSecurityRecord();
    try {
      await SQLite.deleteDatabaseAsync(DATABASE_NAME);
    } catch {
      // The database may not exist yet on a fresh device.
    }
  },
  async clearPinMetadata() {
    await deleteSecurityRecord();
  },
};

async function derivePinKey(
  userId: string,
  pin: string,
  saltHex: string,
  deviceSecret: string
) {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${userId}:${pin}:${saltHex}:${deviceSecret}`,
    {
      encoding: Crypto.CryptoEncoding.HEX,
    }
  );

  return AESEncryptionKey.import(digest, 'hex');
}

async function ensureDeviceSecret() {
  const secureStore = getRequiredSecureStoreModule();
  const existing = await secureStore.getItemAsync(DEVICE_SECRET_STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const nextSecret = randomHex(32);
  await secureStore.setItemAsync(DEVICE_SECRET_STORAGE_KEY, nextSecret);
  return nextSecret;
}

async function readSecurityRecord() {
  const secureStore = getSecureStoreModule();

  if (!secureStore) {
    return null;
  }

  const rawValue = await secureStore.getItemAsync(SECURITY_RECORD_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as PinSecurityRecord;
  } catch {
    await deleteSecurityRecord();
    return null;
  }
}

async function writeSecurityRecord(record: PinSecurityRecord) {
  const secureStore = getRequiredSecureStoreModule();
  await secureStore.setItemAsync(SECURITY_RECORD_STORAGE_KEY, JSON.stringify(record));
}

async function deleteSecurityRecord() {
  const secureStore = getSecureStoreModule();

  if (!secureStore) {
    return;
  }

  await secureStore.deleteItemAsync(SECURITY_RECORD_STORAGE_KEY);
}

function getSecureStoreModule(): SecureStoreModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-secure-store') as SecureStoreModule;
  } catch {
    return null;
  }
}

function getRequiredSecureStoreModule() {
  const secureStore = getSecureStoreModule();

  if (!secureStore) {
    throw new Error('Bezpieczne przechowywanie danych nie jest dostępne w tym buildzie.');
  }

  return secureStore;
}

function assertRuntimeSupported() {
  const support = localSecurityService.getRuntimeSupport();

  if (!support.supported) {
    throw new Error(support.message ?? 'Bezpieczne uruchamianie aplikacji nie jest dostępne.');
  }
}

function assertPinFormat(pin: string) {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error('PIN musi składać się dokładnie z 4 cyfr.');
  }
}

function randomHex(byteCount: number) {
  return Array.from(Crypto.getRandomBytes(byteCount), (value) =>
    value.toString(16).padStart(2, '0')
  ).join('');
}

function encodeText(value: string) {
  return new TextEncoder().encode(value);
}

function decodeText(value: Uint8Array) {
  return new TextDecoder().decode(value);
}
