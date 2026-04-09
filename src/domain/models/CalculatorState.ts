import type { Cost } from './Cost';
import type { Income } from './Income';
import type { TaxSettings } from './TaxSettings';

export type VatDetails = {
  outputVat: number;
  inputVat: number;
  vatPayable: number;
};

export type Deductions = {
  pit: number;
  vat: number;
  zusTotal: number;
  healthContribution: number;
  solidarityLevy: number;
};

export type CalculatedResults = {
  grossRevenue: number;
  netIncome: number;
  deductions: Deductions;
  vatDetails: VatDetails;
};

export type CalculatorState = {
  incomes: Income[];
  costs: Cost[];
  taxSettings: TaxSettings;
};
