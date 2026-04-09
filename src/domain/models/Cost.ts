export type CostCategory = 'STANDARD' | 'CAR_MIXED' | 'CAR_BUSINESS';

export type Cost = {
  id: string;
  label: string;
  netAmount: number;
  vatRate: number;
  category: CostCategory;
};
