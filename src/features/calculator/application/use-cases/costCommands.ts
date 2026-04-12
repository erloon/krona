import type { CostCategory, CostVatRate } from '@/features/calculator/domain/entities/cost';
import type { MonthlyReportingPeriod } from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';

export type CostEditorInput = Readonly<{
  label: string;
  description: string;
  netAmount: number;
  vatRate: CostVatRate;
  category: CostCategory;
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
