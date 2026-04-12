import type { SQLiteDatabase } from 'expo-sqlite';

let activeDatabase: SQLiteDatabase | null = null;

export function registerActiveDatabase(database: SQLiteDatabase) {
  activeDatabase = database;
}

export function unregisterActiveDatabase(database: SQLiteDatabase) {
  if (activeDatabase === database) {
    activeDatabase = null;
  }
}

export async function closeActiveDatabase() {
  if (!activeDatabase) {
    return;
  }

  const database = activeDatabase;
  activeDatabase = null;

  try {
    await database.closeAsync();
  } catch {
    // The provider may already be unmounting and closing the same handle.
  }
}
