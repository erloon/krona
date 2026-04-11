import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';

export async function deleteIncomeUseCase(
  calculatorRepository: CalculatorRepository,
  reportingPeriodId: string,
  incomeId: string
): Promise<void> {
  await calculatorRepository.deleteIncome(reportingPeriodId, incomeId);
}
