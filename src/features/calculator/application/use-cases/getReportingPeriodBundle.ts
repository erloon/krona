import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';
import type { MonthlyReportingPeriod } from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';

export async function getReportingPeriodBundleUseCase(
  calculatorRepository: CalculatorRepository,
  period: MonthlyReportingPeriod
): Promise<ReportingPeriodBundle> {
  return calculatorRepository.getReportingPeriodBundle(period);
}
