import React from 'react';

type DatabaseProviderProps = {
  children: React.ReactNode;
  databaseKey: string;
};

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  return <>{children}</>;
}
