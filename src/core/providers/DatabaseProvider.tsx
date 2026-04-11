import React from 'react';

type DatabaseProviderProps = {
  children: React.ReactNode;
};

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  return <>{children}</>;
}
