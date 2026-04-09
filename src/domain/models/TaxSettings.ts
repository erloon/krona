export type TaxationForm = 'SCALE' | 'FLAT_19' | 'LUMP_SUM';

export type ZusStatus = 'STANDARD' | 'PREFERENTIAL' | 'STARTUP' | 'UOP';

export type VatStatus = 'ACTIVE' | 'EXEMPT';

export type TaxSettings = {
  taxationForm: TaxationForm;
  lumpSumRate: number;
  zusStatus: ZusStatus;
  voluntarySicknessInsurance: boolean;
  unpaidHolidayDays: number;
  vatStatus: VatStatus;
  taxYear: number;
  ipBox: boolean;
  ipBoxQualifiedIncomePercent: number;
  ipBoxCostsA: number;
  ipBoxCostsB: number;
  ipBoxCostsC: number;
  ipBoxCostsD: number;
  returnRelief: boolean;
  familyRelief: boolean;
  jointTaxation: boolean;
  jointTaxationSpouseAnnualIncome: number;
};
