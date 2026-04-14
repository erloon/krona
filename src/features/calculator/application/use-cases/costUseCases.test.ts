import {
  createDefaultEmptyCalculationSnapshot,
  createDefaultReportingPeriodRecord,
  createReportingPeriodId,
} from '@/features/calculator/infrastructure/mappers/calculatorRecordMapper';
import { createCost } from '@/features/calculator/domain/entities/cost';
import { createIncome } from '@/features/calculator/domain/entities/income';
import type { MonthlyCalculationSnapshot } from '@/features/calculator/domain/entities/monthly-calculation-snapshot';
import type { ReportingPeriod } from '@/features/calculator/domain/entities/reporting-period';
import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import {
  createReportingPeriodSettingsSnapshotFromAppSettings,
  type ReportingPeriodSettingsSnapshot,
} from '@/features/calculator/domain/entities/reporting-period-settings-snapshot';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';
import { createMonthlyReportingPeriod } from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';
import { createDefaultAppSettings, type AppSettings } from '@/features/settings/domain/entities/app-settings';
import type { SettingsRepository } from '@/features/settings/domain/repositories/SettingsRepository';

import { createCostForPeriodUseCase } from './createCostForPeriod';
import { deleteCostFromPeriodUseCase } from './deleteCostFromPeriod';
import { duplicateCostInPeriodUseCase } from './duplicateCostInPeriod';
import { loadIncomesForPeriodUseCase } from './loadIncomesForPeriod';
import { updateCostForPeriodUseCase } from './updateCostForPeriod';

export async function testCreateAndUpdateCostRecalculateSnapshot(): Promise<void> {
  const fixtures = createFixtures();
  const period = createMonthlyReportingPeriod(2026, 4);

  const createdBundle = await createCostForPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    {
      period,
      input: {
        label: 'Leasing auta',
        description: 'Rata miesięczna',
        nip: '',
        supplierName: '',
        supplierAddress: '',
        enteredNetAmount: 1000,
        currency: 'PLN',
        netAmount: 1000,
        vatRate: '23',
        category: 'CAR_MIXED',
        exchangeRate: 1,
        exchangeRateSource: 'STATIC',
        exchangeRateReferenceDate: '2026-04-01',
        exchangeRateEffectiveDate: '2026-04-01',
        attachment: null,
      },
    }
  );

  assert(createdBundle.costs.length === 1, 'Expected a created cost in the selected period.');
  assert(createdBundle.calculationSnapshot.costAmount === 1115, 'Cash cost should include non-deductible VAT.');
  assert(
    createdBundle.calculationSnapshot.deductibleCostAmount === 836.25,
    'Deductible PIT amount should follow mixed-use rules.'
  );

  const updatedBundle = await updateCostForPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    {
      period,
      costId: createdBundle.costs[0].id,
      input: {
        label: 'Leasing auta premium',
        description: 'Rata po korekcie',
        nip: '',
        supplierName: '',
        supplierAddress: '',
        enteredNetAmount: 1200,
        currency: 'PLN',
        netAmount: 1200,
        vatRate: '23',
        category: 'CAR_BUSINESS',
        exchangeRate: 1,
        exchangeRateSource: 'STATIC',
        exchangeRateReferenceDate: '2026-04-01',
        exchangeRateEffectiveDate: '2026-04-01',
        attachment: null,
      },
    }
  );

  assert(updatedBundle.costs[0].label === 'Leasing auta premium', 'Updated label should be saved.');
  assert(updatedBundle.calculationSnapshot.costAmount === 1200, 'Business-use car should use full VAT deduction for cash cost.');
  assert(
    updatedBundle.calculationSnapshot.deductibleCostAmount === 1200,
    'Business-use car should remain fully deductible.'
  );
}

export async function testDuplicateAndDeleteCostKeepOtherPeriodsUntouched(): Promise<void> {
  const fixtures = createFixtures();
  const april = createMonthlyReportingPeriod(2026, 4);
  const may = createMonthlyReportingPeriod(2026, 5);

  const aprilBundle = await createCostForPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    {
      period: april,
      input: {
        label: 'Biuro',
        description: '',
        nip: '',
        supplierName: '',
        supplierAddress: '',
        enteredNetAmount: 500,
        currency: 'PLN',
        netAmount: 500,
        vatRate: '23',
        category: 'STANDARD',
        exchangeRate: 1,
        exchangeRateSource: 'STATIC',
        exchangeRateReferenceDate: '2026-04-01',
        exchangeRateEffectiveDate: '2026-04-01',
        attachment: null,
      },
    }
  );

  await createCostForPeriodUseCase(fixtures.calculatorRepository, fixtures.settingsRepository, {
    period: may,
    input: {
      label: 'Paliwo',
      description: '',
      nip: '',
      supplierName: '',
      supplierAddress: '',
      enteredNetAmount: 300,
      currency: 'PLN',
      netAmount: 300,
      vatRate: '23',
      category: 'CAR_MIXED',
      exchangeRate: 1,
      exchangeRateSource: 'STATIC',
      exchangeRateReferenceDate: '2026-05-01',
      exchangeRateEffectiveDate: '2026-05-01',
      attachment: null,
    },
  });

  const duplicatedBundle = await duplicateCostInPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    {
      period: april,
      costId: aprilBundle.costs[0].id,
    }
  );

  assert(duplicatedBundle.costs.length === 2, 'Expected the selected April cost to be duplicated.');
  assert(
    duplicatedBundle.costs[0].id !== duplicatedBundle.costs[1].id,
    'Duplicated cost should receive a new id.'
  );

  const deletedBundle = await deleteCostFromPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    {
      period: april,
      costId: duplicatedBundle.costs[0].id,
    }
  );
  const mayBundle = await loadIncomesForPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    may
  );

  assert(deletedBundle.costs.length === 1, 'Deleting one duplicated cost should keep the other April record.');
  assert(mayBundle.costs.length === 1, 'May costs must remain untouched.');
  assert(mayBundle.costs[0].label === 'Paliwo', 'Other periods must preserve their data.');
}

function createFixtures() {
  let settings = createDefaultAppSettings('2026-04-01T08:00:00.000Z');
  const calculatorRepository = new InMemoryCalculatorRepository();
  const settingsRepository: SettingsRepository = {
    async getSettings() {
      return settings;
    },
    async saveSettings(next: AppSettings) {
      settings = next;
      return settings;
    },
    async updateSettings() {
      return settings;
    },
    async clearSettings() {
      settings = createDefaultAppSettings('2026-04-01T08:00:00.000Z');
    },
  };

  return {
    calculatorRepository,
    settingsRepository,
  };
}

class InMemoryCalculatorRepository implements CalculatorRepository {
  private reportingPeriods = new Map<string, ReportingPeriod>();
  private settingsSnapshots = new Map<string, ReportingPeriodSettingsSnapshot>();
  private calculationSnapshots = new Map<string, MonthlyCalculationSnapshot>();
  private incomes = new Map<string, ReturnType<typeof createIncome>>();
  private costs = new Map<string, ReturnType<typeof createCost>>();

  async ensureReportingPeriod(period: ReturnType<typeof createMonthlyReportingPeriod>, settingsSnapshot: ReportingPeriodSettingsSnapshot) {
    const id = createReportingPeriodId(period.year, period.month);
    const existingPeriod = this.reportingPeriods.get(id);

    if (existingPeriod) {
      return existingPeriod;
    }

    const reportingPeriod = createDefaultReportingPeriodRecord({
      id,
      year: period.year,
      month: period.month,
      now: '2026-04-01T08:00:00.000Z',
    });

    this.reportingPeriods.set(id, reportingPeriod);
    this.settingsSnapshots.set(
      id,
      createReportingPeriodSettingsSnapshotFromAppSettings(id, {
        ...createDefaultAppSettings('2026-04-01T08:00:00.000Z'),
        ...settingsSnapshotToAppSettings(settingsSnapshot),
      })
    );
    this.calculationSnapshots.set(id, createDefaultEmptyCalculationSnapshot(id));

    return reportingPeriod;
  }

  async getReportingPeriodBundle(period: ReturnType<typeof createMonthlyReportingPeriod>): Promise<ReportingPeriodBundle> {
    const reportingPeriodId = createReportingPeriodId(period.year, period.month);
    const reportingPeriod = this.reportingPeriods.get(reportingPeriodId);
    const settingsSnapshot = this.settingsSnapshots.get(reportingPeriodId);
    const calculationSnapshot = this.calculationSnapshots.get(reportingPeriodId);

    if (!reportingPeriod || !settingsSnapshot || !calculationSnapshot) {
      throw new Error(`Reporting period ${period.key} was not initialized.`);
    }

    return {
      reportingPeriod,
      settingsSnapshot,
      calculationSnapshot,
      incomes: [...this.incomes.values()].filter((income) => income.reportingPeriodId === reportingPeriodId),
      costs: [...this.costs.values()].filter((cost) => cost.reportingPeriodId === reportingPeriodId),
    };
  }

  async saveIncome(income: ReturnType<typeof createIncome>) {
    this.incomes.set(income.id, income);
    return income;
  }

  async deleteIncome(reportingPeriodId: string, incomeId: string): Promise<void> {
    const income = this.incomes.get(incomeId);

    if (income?.reportingPeriodId === reportingPeriodId) {
      this.incomes.delete(incomeId);
    }
  }

  async saveCost(cost: ReturnType<typeof createCost>) {
    this.costs.set(cost.id, cost);
    return cost;
  }

  async deleteCost(reportingPeriodId: string, costId: string): Promise<void> {
    const cost = this.costs.get(costId);

    if (cost?.reportingPeriodId === reportingPeriodId) {
      this.costs.delete(costId);
    }
  }

  async saveMonthlyCalculationSnapshot(snapshot: MonthlyCalculationSnapshot) {
    this.calculationSnapshots.set(snapshot.reportingPeriodId, snapshot);
    return snapshot;
  }

  async listReportingPeriods(): Promise<readonly ReportingPeriod[]> {
    return [...this.reportingPeriods.values()];
  }

  async saveReportingPeriodSettingsSnapshot(snapshot: ReportingPeriodSettingsSnapshot) {
    this.settingsSnapshots.set(snapshot.reportingPeriodId, snapshot);
    return snapshot;
  }

  async hasAnyIncomes(): Promise<boolean> {
    return this.incomes.size > 0;
  }

  async hasAnyCosts(): Promise<boolean> {
    return this.costs.size > 0;
  }

  async clearAllData(): Promise<void> {
    this.reportingPeriods.clear();
    this.settingsSnapshots.clear();
    this.calculationSnapshots.clear();
    this.incomes.clear();
    this.costs.clear();
  }
}

function settingsSnapshotToAppSettings(snapshot: ReportingPeriodSettingsSnapshot) {
  return {
    tax: {
      taxYear: snapshot.taxYear,
      taxationForm: snapshot.taxationForm,
      lumpSumRate: snapshot.lumpSumRate,
      jointTaxation: snapshot.jointTaxation,
      jointTaxationSpouseAnnualIncome: snapshot.jointTaxationSpouseAnnualIncome,
    },
    zus: {
      zusStatus: snapshot.zusStatus,
      voluntarySicknessInsurance: snapshot.voluntarySicknessInsurance,
    },
    vat: {
      vatStatus: snapshot.vatStatus,
    },
    reliefs: {
      ipBox: snapshot.ipBox,
      ipBoxQualifiedIncomePercent: snapshot.ipBoxQualifiedIncomePercent,
      ipBoxCostsA: snapshot.ipBoxCostsA,
      ipBoxCostsB: snapshot.ipBoxCostsB,
      ipBoxCostsC: snapshot.ipBoxCostsC,
      ipBoxCostsD: snapshot.ipBoxCostsD,
      returnRelief: snapshot.returnRelief,
      familyRelief: snapshot.familyRelief,
    },
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
