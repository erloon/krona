import { create } from 'zustand';
import type { CalculatedResults, CalculatorState, Cost, Income, TaxSettings } from '../../domain/models';

type CalculatorStore = {
  state: CalculatorState;
  results: CalculatedResults | null;
  addIncome: (income: Income) => void;
  removeIncome: (id: string) => void;
  addCost: (cost: Cost) => void;
  removeCost: (id: string) => void;
  updateTaxSettings: (settings: Partial<TaxSettings>) => void;
  reset: () => void;
};

const initialState: CalculatorState = {
  incomes: [],
  costs: [],
  taxSettings: {
    taxationForm: 'SCALE',
    lumpSumRate: 0.12,
    zusStatus: 'STANDARD',
    voluntarySicknessInsurance: false,
    unpaidHolidayDays: 0,
    vatStatus: 'ACTIVE',
    taxYear: 2026,
    ipBox: false,
    ipBoxQualifiedIncomePercent: 0,
    ipBoxCostsA: 0,
    ipBoxCostsB: 0,
    ipBoxCostsC: 0,
    ipBoxCostsD: 0,
    returnRelief: false,
    familyRelief: false,
    jointTaxation: false,
    jointTaxationSpouseAnnualIncome: 0,
  },
};

export const useCalculatorStore = create<CalculatorStore>()((set) => ({
  state: initialState,
  results: null,
  addIncome: (income) =>
    set((s) => ({ state: { ...s.state, incomes: [...s.state.incomes, income] } })),
  removeIncome: (id) =>
    set((s) => ({ state: { ...s.state, incomes: s.state.incomes.filter((i) => i.id !== id) } })),
  addCost: (cost) =>
    set((s) => ({ state: { ...s.state, costs: [...s.state.costs, cost] } })),
  removeCost: (id) =>
    set((s) => ({ state: { ...s.state, costs: s.state.costs.filter((c) => c.id !== id) } })),
  updateTaxSettings: (settings) =>
    set((s) => ({ state: { ...s.state, taxSettings: { ...s.state.taxSettings, ...settings } } })),
  reset: () => set({ state: initialState, results: null }),
}));
