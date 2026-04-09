import type { Income } from '../../domain/models';

export type IncomeRepository = {
  getAll(): Promise<Income[]>;
  getById(id: string): Promise<Income | null>;
  save(income: Income): Promise<void>;
  delete(id: string): Promise<void>;
};
