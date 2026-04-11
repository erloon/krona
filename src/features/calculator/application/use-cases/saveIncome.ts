import type { Income } from '@/features/calculator/domain/entities/income';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';

export async function saveIncomeUseCase(
  calculatorRepository: CalculatorRepository,
  income: Income
): Promise<Income> {
  return calculatorRepository.saveIncome(income);
}
