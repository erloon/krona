export type PinSecurityRecord = {
  version: 1;
  userId: string;
  saltHex: string;
  wrappedDatabaseKeyBase64: string;
  createdAt: number;
  updatedAt: number;
};

export type PinSetupResult = {
  databaseKey: string;
};
