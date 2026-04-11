import type {
  IncomeBillingType,
  IncomeCurrency,
  IncomeVatRate,
} from '@/features/calculator/domain/entities/income';
import type { MonthlyReportingPeriod } from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';

export type IncomeEditorInput = Readonly<{
  label: string;
  description: string;
  baseAmount: number;
  billingType: IncomeBillingType;
  currency: IncomeCurrency;
  vatRate: IncomeVatRate;
  clientName: string;
  invoiceNumber: string;
  workParameters: {
    workingDaysPerMonth: number;
    workingHoursPerDay: number;
  };
}>;

export type IncomePeriodCommand = Readonly<{
  period: MonthlyReportingPeriod;
}>;

export type CreateIncomeForPeriodCommand = IncomePeriodCommand &
  Readonly<{
    input: IncomeEditorInput;
  }>;

export type UpdateIncomeForPeriodCommand = IncomePeriodCommand &
  Readonly<{
    incomeId: string;
    input: IncomeEditorInput;
  }>;

export type DuplicateIncomeInPeriodCommand = IncomePeriodCommand &
  Readonly<{
    incomeId: string;
  }>;

export type DeleteIncomeFromPeriodCommand = IncomePeriodCommand &
  Readonly<{
    incomeId: string;
  }>;
