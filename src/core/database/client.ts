import type { SQLiteDatabase } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';

import { schema } from './schema';

export const DATABASE_NAME = 'krona.db';

export function createDrizzleDb(database: SQLiteDatabase) {
  return drizzle(database, { schema });
}

export type DrizzleDatabase = ReturnType<typeof createDrizzleDb>;
