import React from 'react';
import { SQLiteProvider } from 'expo-sqlite';

import { DATABASE_NAME } from '@/core/database/client';
import { initializeDatabase } from '@/core/database/migrations';

type DatabaseProviderProps = {
  children: React.ReactNode;
};

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  return (
    <SQLiteProvider
      databaseName={DATABASE_NAME}
      onInit={initializeDatabase}
      useSuspense={false}
    >
      {children}
    </SQLiteProvider>
  );
}
