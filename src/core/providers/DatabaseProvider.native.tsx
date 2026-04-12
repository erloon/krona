import React from 'react';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_NAME } from '@/core/database/client';
import { initializeDatabase } from '@/core/database/migrations';
import { registerActiveDatabase, unregisterActiveDatabase } from '@/core/database/runtime';

type DatabaseProviderProps = {
  children: React.ReactNode;
  databaseKey: string;
};

export function DatabaseProvider({ children, databaseKey }: DatabaseProviderProps) {
  const onInit = React.useCallback(
    async (database: SQLiteDatabase) => {
      await database.execAsync(`PRAGMA key = '${escapeSqlString(databaseKey)}';`);
      await database.getFirstAsync('SELECT count(*) as count FROM sqlite_master;');
      await initializeDatabase(database);
    },
    [databaseKey]
  );

  return (
    <SQLiteProvider
      databaseName={DATABASE_NAME}
      onInit={onInit}
      useSuspense={false}
    >
      <DatabaseRuntimeBridge>{children}</DatabaseRuntimeBridge>
    </SQLiteProvider>
  );
}

function DatabaseRuntimeBridge({ children }: { children: React.ReactNode }) {
  const database = useSQLiteContext();

  React.useEffect(() => {
    registerActiveDatabase(database);

    return () => {
      unregisterActiveDatabase(database);
    };
  }, [database]);

  return <>{children}</>;
}

function escapeSqlString(value: string) {
  return value.replaceAll("'", "''");
}
