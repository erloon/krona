import type {
  CostAttachment,
  CostCategory,
  CostCurrency,
  CostVatRate,
} from '@/features/calculator/domain/entities/cost';
import type { IncomeExchangeRateSource } from '@/features/calculator/domain/entities/income';
import type { MonthlyReportingPeriod } from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';

export type CostEditorInput = Readonly<{
  label: string;
  description: string;
  enteredNetAmount: number;
  currency: CostCurrency;
  netAmount: number;
  vatRate: CostVatRate;
  category: CostCategory;
  exchangeRate: number;
  exchangeRateSource: IncomeExchangeRateSource;
  exchangeRateReferenceDate: string;
  exchangeRateEffectiveDate: string;
  attachment: CostAttachment | null;
}>;

export type CostPeriodCommand = Readonly<{
  period: MonthlyReportingPeriod;
}>;

export type CreateCostForPeriodCommand = CostPeriodCommand &
  Readonly<{
    input: CostEditorInput;
  }>;

export type UpdateCostForPeriodCommand = CostPeriodCommand &
  Readonly<{
    costId: string;
    input: CostEditorInput;
  }>;

export type DuplicateCostInPeriodCommand = CostPeriodCommand &
  Readonly<{
    costId: string;
  }>;

export type DeleteCostFromPeriodCommand = CostPeriodCommand &
  Readonly<{
    costId: string;
  }>;
