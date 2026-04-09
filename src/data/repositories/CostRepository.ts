import type { Cost } from '../../domain/models';

export type CostRepository = {
  getAll(): Promise<Cost[]>;
  getById(id: string): Promise<Cost | null>;
  save(cost: Cost): Promise<void>;
  delete(id: string): Promise<void>;
};
