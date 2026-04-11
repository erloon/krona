export const COST_CATEGORIES = ['STANDARD', 'CAR_MIXED', 'CAR_BUSINESS'] as const;
export const COST_VAT_RATES = ['ZW', '0', '5', '8', '23'] as const;

export type CostCategory = (typeof COST_CATEGORIES)[number];
export type CostVatRate = (typeof COST_VAT_RATES)[number];

export type Cost = Readonly<{
  id: string;
  reportingPeriodId: string;
  label: string;
  description: string;
  netAmount: number;
  vatRate: CostVatRate;
  category: CostCategory;
  createdAt: string;
  updatedAt: string;
}>;

export function createCost(params: {
  id: string;
  reportingPeriodId: string;
  label: string;
  description?: string;
  netAmount: number;
  vatRate?: CostVatRate;
  category?: CostCategory;
  createdAt?: string;
  updatedAt?: string;
}): Cost {
  const timestamp = params.createdAt ?? new Date().toISOString();

  return Object.freeze({
    id: params.id,
    reportingPeriodId: params.reportingPeriodId,
    label: params.label.trim(),
    description: params.description?.trim() ?? '',
    netAmount: params.netAmount,
    vatRate: params.vatRate ?? '23',
    category: params.category ?? 'STANDARD',
    createdAt: timestamp,
    updatedAt: params.updatedAt ?? timestamp,
  });
}
