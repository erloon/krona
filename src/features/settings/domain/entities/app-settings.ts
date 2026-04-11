export const APP_SETTINGS_ID = 'app_settings';
export const APP_SETTINGS_VERSION = 1;

export type TaxationForm = 'SCALE' | 'FLAT_19' | 'LUMP_SUM';
export type LumpSumRate = '17' | '15' | '14' | '12' | '8_5' | '5_5' | '3' | '2';
export type ZusStatus = 'STANDARD' | 'PREFERENTIAL' | 'STARTUP' | 'UOP';
export type VatStatus = 'ACTIVE' | 'EXEMPT';
export type AppLanguage = 'pl-PL' | 'en-US';
export type AppCurrency = 'PLN' | 'EUR' | 'USD' | 'GBP' | 'CHF';

export type AppSettings = {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  profile: {
    companyName: string;
    nip: string;
    address: string;
  };
  tax: {
    taxYear: number;
    taxationForm: TaxationForm;
    lumpSumRate: LumpSumRate;
    jointTaxation: boolean;
    jointTaxationSpouseAnnualIncome: string;
  };
  zus: {
    zusStatus: ZusStatus;
    voluntarySicknessInsurance: boolean;
  };
  reliefs: {
    ipBox: boolean;
    ipBoxQualifiedIncomePercent: string;
    ipBoxCostsA: string;
    ipBoxCostsB: string;
    ipBoxCostsC: string;
    ipBoxCostsD: string;
    returnRelief: boolean;
    familyRelief: boolean;
  };
  vat: {
    vatStatus: VatStatus;
  };
  preferences: {
    language: AppLanguage;
    defaultCurrency: AppCurrency;
  };
};

export type SettingsPatch = Partial<{
  profile: Partial<AppSettings['profile']>;
  tax: Partial<AppSettings['tax']>;
  zus: Partial<AppSettings['zus']>;
  reliefs: Partial<AppSettings['reliefs']>;
  vat: Partial<AppSettings['vat']>;
  preferences: Partial<AppSettings['preferences']>;
}>;

export function createDefaultAppSettings(now = new Date().toISOString()): AppSettings {
  return {
    id: APP_SETTINGS_ID,
    version: APP_SETTINGS_VERSION,
    createdAt: now,
    updatedAt: now,
    profile: {
      companyName: '',
      nip: '',
      address: '',
    },
    tax: {
      taxYear: 2026,
      taxationForm: 'FLAT_19',
      lumpSumRate: '12',
      jointTaxation: false,
      jointTaxationSpouseAnnualIncome: '0',
    },
    zus: {
      zusStatus: 'PREFERENTIAL',
      voluntarySicknessInsurance: true,
    },
    reliefs: {
      ipBox: false,
      ipBoxQualifiedIncomePercent: '100',
      ipBoxCostsA: '0',
      ipBoxCostsB: '0',
      ipBoxCostsC: '0',
      ipBoxCostsD: '0',
      returnRelief: false,
      familyRelief: false,
    },
    vat: {
      vatStatus: 'ACTIVE',
    },
    preferences: {
      language: 'pl-PL',
      defaultCurrency: 'PLN',
    },
  };
}

export function applySettingsPatch(settings: AppSettings, patch: SettingsPatch): AppSettings {
  return sanitizeSettings({
    ...settings,
    profile: {
      ...settings.profile,
      ...patch.profile,
    },
    tax: {
      ...settings.tax,
      ...patch.tax,
    },
    zus: {
      ...settings.zus,
      ...patch.zus,
    },
    reliefs: {
      ...settings.reliefs,
      ...patch.reliefs,
    },
    vat: {
      ...settings.vat,
      ...patch.vat,
    },
    preferences: {
      ...settings.preferences,
      ...patch.preferences,
    },
  });
}

export function sanitizeSettings(settings: AppSettings): AppSettings {
  const nextSettings = {
    ...settings,
    version: APP_SETTINGS_VERSION,
    tax: {
      ...settings.tax,
    },
    zus: {
      ...settings.zus,
    },
    reliefs: {
      ...settings.reliefs,
    },
  };

  if (nextSettings.tax.taxationForm !== 'SCALE') {
    nextSettings.tax.jointTaxation = false;
    nextSettings.tax.jointTaxationSpouseAnnualIncome = '0';
  }

  if (nextSettings.tax.taxationForm === 'LUMP_SUM') {
    nextSettings.reliefs.ipBox = false;
  }

  if (nextSettings.zus.zusStatus === 'STARTUP' || nextSettings.zus.zusStatus === 'UOP') {
    nextSettings.zus.voluntarySicknessInsurance = false;
  }

  return nextSettings;
}

export function withUpdatedTimestamp(settings: AppSettings, now = new Date().toISOString()): AppSettings {
  return {
    ...settings,
    updatedAt: now,
  };
}
