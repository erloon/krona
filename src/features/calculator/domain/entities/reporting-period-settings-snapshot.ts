import type {
  AppSettings,
  LumpSumRate,
  TaxationForm,
  VatStatus,
  ZusStatus,
} from '@/features/settings/domain/entities/app-settings';

export const REPORTING_PERIOD_SETTINGS_SNAPSHOT_VERSION = 1;

export type ReportingPeriodSettingsSnapshot = Readonly<{
  reportingPeriodId: string;
  version: number;
  taxYear: number;
  taxationForm: TaxationForm;
  lumpSumRate: LumpSumRate;
  jointTaxation: boolean;
  jointTaxationSpouseAnnualIncome: string;
  zusStatus: ZusStatus;
  voluntarySicknessInsurance: boolean;
  vatStatus: VatStatus;
  ipBox: boolean;
  ipBoxQualifiedIncomePercent: string;
  ipBoxCostsA: string;
  ipBoxCostsB: string;
  ipBoxCostsC: string;
  ipBoxCostsD: string;
  returnRelief: boolean;
  familyRelief: boolean;
  createdAt: string;
  updatedAt: string;
}>;

export function createReportingPeriodSettingsSnapshot(params: {
  reportingPeriodId: string;
  taxYear: number;
  taxationForm: TaxationForm;
  lumpSumRate: LumpSumRate;
  jointTaxation: boolean;
  jointTaxationSpouseAnnualIncome: string;
  zusStatus: ZusStatus;
  voluntarySicknessInsurance: boolean;
  vatStatus: VatStatus;
  ipBox: boolean;
  ipBoxQualifiedIncomePercent: string;
  ipBoxCostsA: string;
  ipBoxCostsB: string;
  ipBoxCostsC: string;
  ipBoxCostsD: string;
  returnRelief: boolean;
  familyRelief: boolean;
  createdAt?: string;
  updatedAt?: string;
}): ReportingPeriodSettingsSnapshot {
  const timestamp = params.createdAt ?? new Date().toISOString();

  return Object.freeze({
    reportingPeriodId: params.reportingPeriodId,
    version: REPORTING_PERIOD_SETTINGS_SNAPSHOT_VERSION,
    taxYear: params.taxYear,
    taxationForm: params.taxationForm,
    lumpSumRate: params.lumpSumRate,
    jointTaxation: params.jointTaxation,
    jointTaxationSpouseAnnualIncome: params.jointTaxationSpouseAnnualIncome,
    zusStatus: params.zusStatus,
    voluntarySicknessInsurance: params.voluntarySicknessInsurance,
    vatStatus: params.vatStatus,
    ipBox: params.ipBox,
    ipBoxQualifiedIncomePercent: params.ipBoxQualifiedIncomePercent,
    ipBoxCostsA: params.ipBoxCostsA,
    ipBoxCostsB: params.ipBoxCostsB,
    ipBoxCostsC: params.ipBoxCostsC,
    ipBoxCostsD: params.ipBoxCostsD,
    returnRelief: params.returnRelief,
    familyRelief: params.familyRelief,
    createdAt: timestamp,
    updatedAt: params.updatedAt ?? timestamp,
  });
}

export function createReportingPeriodSettingsSnapshotFromAppSettings(
  reportingPeriodId: string,
  settings: AppSettings
): ReportingPeriodSettingsSnapshot {
  return createReportingPeriodSettingsSnapshot({
    reportingPeriodId,
    taxYear: settings.tax.taxYear,
    taxationForm: settings.tax.taxationForm,
    lumpSumRate: settings.tax.lumpSumRate,
    jointTaxation: settings.tax.jointTaxation,
    jointTaxationSpouseAnnualIncome: settings.tax.jointTaxationSpouseAnnualIncome,
    zusStatus: settings.zus.zusStatus,
    voluntarySicknessInsurance: settings.zus.voluntarySicknessInsurance,
    vatStatus: settings.vat.vatStatus,
    ipBox: settings.reliefs.ipBox,
    ipBoxQualifiedIncomePercent: settings.reliefs.ipBoxQualifiedIncomePercent,
    ipBoxCostsA: settings.reliefs.ipBoxCostsA,
    ipBoxCostsB: settings.reliefs.ipBoxCostsB,
    ipBoxCostsC: settings.reliefs.ipBoxCostsC,
    ipBoxCostsD: settings.reliefs.ipBoxCostsD,
    returnRelief: settings.reliefs.returnRelief,
    familyRelief: settings.reliefs.familyRelief,
  });
}
