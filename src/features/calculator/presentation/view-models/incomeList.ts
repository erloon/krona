export type IncomeListItemViewModel = {
  id: string;
  monthKey: string;
  title: string;
  metadata: string;
  amount: number;
  currency: 'PLN';
  vatLabel: string;
};

export type IncomeSummaryViewModel = {
  monthLabel: string;
  totalNetAmount: number;
  vatAmount: number;
  pitAmount: number;
};

export const incomeListSummary: IncomeSummaryViewModel = {
  monthLabel: 'Marzec 2026',
  totalNetAmount: 142500,
  vatAmount: 32775,
  pitAmount: 17100,
};

export const incomeListItems: IncomeListItemViewModel[] = [
  {
    id: 'income-acme-global',
    monthKey: 'Marzec 2026',
    title: 'Acme Global Solutions Inc.',
    metadata: 'Faktura #2026/03/14',
    amount: 42000,
    currency: 'PLN',
    vatLabel: 'VAT 23%',
  },
  {
    id: 'income-nebula-creatives',
    monthKey: 'Marzec 2026',
    title: 'Nebula Creatives Ltd.',
    metadata: 'Umowa o dzieło',
    amount: 12500,
    currency: 'PLN',
    vatLabel: 'VAT 8%',
  },
  {
    id: 'income-fintech-horizon',
    monthKey: 'Marzec 2026',
    title: 'Fintech Horizon Partners',
    metadata: 'Faktura #2026/03/05',
    amount: 88000,
    currency: 'PLN',
    vatLabel: 'VAT 23%',
  },
];

const amountFormatter = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrencyAmount(value: number) {
  return amountFormatter.format(value);
}
