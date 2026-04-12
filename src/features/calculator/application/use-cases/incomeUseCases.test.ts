import {
  createDefaultEmptyCalculationSnapshot,
  createDefaultReportingPeriodRecord,
  createReportingPeriodId,
} from '@/features/calculator/infrastructure/mappers/calculatorRecordMapper';
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

import { createIncomeForPeriodUseCase } from './createIncomeForPeriod';
import { deleteIncomeFromPeriodUseCase } from './deleteIncomeFromPeriod';
import { duplicateIncomeInPeriodUseCase } from './duplicateIncomeInPeriod';
import { loadIncomesForPeriodUseCase } from './loadIncomesForPeriod';
import { updateIncomeForPeriodUseCase } from './updateIncomeForPeriod';

export async function testLoadIncomesForPeriodCreatesMissingMonth(): Promise<void> {
  const fixtures = createFixtures();
  const period = createMonthlyReportingPeriod(2026, 4);

  const bundle = await loadIncomesForPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    period
  );

  assert(bundle.reportingPeriod.year === 2026, 'Expected April reporting period to be created.');
  assert(bundle.settingsSnapshot.taxationForm === 'FLAT_19', 'Expected current settings snapshot.');
}

export async function testLoadIncomesForPeriodKeepsExistingSnapshot(): Promise<void> {
  const fixtures = createFixtures();
  const period = createMonthlyReportingPeriod(2026, 4);

  await loadIncomesForPeriodUseCase(fixtures.calculatorRepository, fixtures.settingsRepository, period);
  fixtures.setSettings({
    ...fixtures.getSettings(),
    tax: {
      ...fixtures.getSettings().tax,
      taxationForm: 'LUMP_SUM',
      lumpSumRate: '8_5',
    },
  });

  const bundle = await loadIncomesForPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    period
  );

  assert(bundle.settingsSnapshot.taxationForm === 'FLAT_19', 'Existing period snapshot must remain unchanged.');
}

export async function testCreateAndUpdateIncomeRecalculateSnapshot(): Promise<void> {
  const fixtures = createFixtures();
  const period = createMonthlyReportingPeriod(2026, 4);

  const createdBundle = await createIncomeForPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    {
      period,
      input: {
        label: 'Main contract',
        description: 'Invoice 04/2026',
        baseAmount: 10000,
        billingType: 'MONTHLY',
        currency: 'PLN',
        vatRate: '23',
        clientName: 'Acme Corp',
        invoiceNumber: 'FV/04/2026',
        workParameters: {
          workingDaysPerMonth: 21,
          workingHoursPerDay: 8,
        },
        exchangeRate: 1,
        exchangeRateSource: 'STATIC',
        exchangeRateEffectiveDate: '2026-04-01',
      },
    }
  );

  assert(createdBundle.incomes.length === 1, 'Expected a created income in the selected period.');
  assert(createdBundle.calculationSnapshot.revenueAmount === 10000, 'Revenue should reflect created income.');
  assert(createdBundle.incomes[0].clientName === 'Acme Corp', 'Client should be persisted.');
  assert(createdBundle.incomes[0].invoiceNumber === 'FV/04/2026', 'Invoice should be persisted.');

  const updatedBundle = await updateIncomeForPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    {
      period,
      incomeId: createdBundle.incomes[0].id,
      input: {
        label: 'Main contract',
        description: 'Invoice 04/2026 corrected',
        baseAmount: 12000,
        billingType: 'MONTHLY',
        currency: 'PLN',
        vatRate: '23',
        clientName: 'Acme Corp',
        invoiceNumber: 'FV/04/2026/K',
        workParameters: {
          workingDaysPerMonth: 20,
          workingHoursPerDay: 7,
        },
        exchangeRate: 1,
        exchangeRateSource: 'STATIC',
        exchangeRateEffectiveDate: '2026-04-01',
      },
    }
  );

  assert(updatedBundle.incomes[0].baseAmount === 12000, 'Income amount should be updated.');
  assert(updatedBundle.calculationSnapshot.revenueAmount === 12000, 'Snapshot should be recalculated after update.');
  assert(updatedBundle.incomes[0].invoiceNumber === 'FV/04/2026/K', 'Updated metadata should be saved.');
  assert(
    updatedBundle.incomes[0].workParameters.workingDaysPerMonth === 20,
    'Updated work parameters should be saved.'
  );
}

export async function testUpdateIncomeAllowsFxMetadataChanges(): Promise<void> {
  const fixtures = createFixtures();
  const period = createMonthlyReportingPeriod(2026, 4);

  const createdBundle = await createIncomeForPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    {
      period,
      input: {
        label: 'Foreign contract',
        description: 'Original USD invoice',
        baseAmount: 2000,
        billingType: 'MONTHLY',
        currency: 'USD',
        vatRate: 'NP',
        clientName: 'Globex',
        invoiceNumber: 'INV-01',
        workParameters: {
          workingDaysPerMonth: 21,
          workingHoursPerDay: 8,
        },
        exchangeRate: 3.9,
        exchangeRateSource: 'NBP_TABLE_A',
        exchangeRateEffectiveDate: '2026-04-01',
      },
    }
  );

  const updatedBundle = await updateIncomeForPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    {
      period,
      incomeId: createdBundle.incomes[0].id,
      input: {
        label: 'Foreign contract',
        description: 'Corrected EUR invoice',
        baseAmount: 1800,
        billingType: 'MONTHLY',
        currency: 'EUR',
        vatRate: 'NP',
        clientName: 'Globex',
        invoiceNumber: 'INV-01-K',
        workParameters: {
          workingDaysPerMonth: 21,
          workingHoursPerDay: 8,
        },
        exchangeRate: 4.21,
        exchangeRateSource: 'CUSTOM',
        exchangeRateEffectiveDate: '2026-04-05',
      },
    }
  );

  assert(updatedBundle.incomes[0].currency === 'EUR', 'Updated income should accept new currency.');
  assert(updatedBundle.incomes[0].exchangeRate === 4.21, 'Updated income should save new exchange rate.');
  assert(
    updatedBundle.incomes[0].exchangeRateSource === 'CUSTOM',
    'Updated income should save the new exchange rate source.'
  );
  assert(
    updatedBundle.incomes[0].exchangeRateEffectiveDate === '2026-04-05',
    'Updated income should save the new exchange rate effective date.'
  );
}

export async function testDuplicateIncomeCreatesNewRecord(): Promise<void> {
  const fixtures = createFixtures();
  const period = createMonthlyReportingPeriod(2026, 4);
  const createdBundle = await createIncomeForPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    {
      period,
      input: {
        label: 'Contract A',
        description: '',
        baseAmount: 8000,
        billingType: 'MONTHLY',
        currency: 'PLN',
        vatRate: '23',
        clientName: '',
        invoiceNumber: '',
        workParameters: {
          workingDaysPerMonth: 21,
          workingHoursPerDay: 8,
        },
        exchangeRate: 1,
        exchangeRateSource: 'STATIC',
        exchangeRateEffectiveDate: '2026-04-01',
      },
    }
  );

  const duplicatedBundle = await duplicateIncomeInPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    {
      period,
      incomeId: createdBundle.incomes[0].id,
    }
  );

  assert(duplicatedBundle.incomes.length === 2, 'Expected a duplicated income.');
  assert(
    duplicatedBundle.incomes[0].id !== duplicatedBundle.incomes[1].id,
    'Duplicate should receive a new id.'
  );
  assert(
    duplicatedBundle.calculationSnapshot.revenueAmount === 16000,
    'Snapshot should include both original and duplicate.'
  );
}

export async function testDuplicateIncomeResetsInvoiceNumberAndDate(): Promise<void> {
  const fixtures = createFixtures();
  const period = createMonthlyReportingPeriod(2026, 4);
  const createdBundle = await createIncomeForPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    {
      period,
      input: {
        label: 'Contract B',
        description: 'Consulting work',
        baseAmount: 15000,
        billingType: 'MONTHLY',
        currency: 'EUR',
        vatRate: 'NP',
        clientName: 'Client XYZ',
        invoiceNumber: 'FV/04/2026/001',
        workParameters: {
          workingDaysPerMonth: 21,
          workingHoursPerDay: 8,
        },
        exchangeRate: 4.25,
        exchangeRateSource: 'NBP_TABLE_A',
        exchangeRateEffectiveDate: '2026-04-01',
      },
    }
  );

  const sourceIncome = createdBundle.incomes[0];
  assert(sourceIncome.invoiceNumber === 'FV/04/2026/001', 'Source should have invoice number.');
  assert(sourceIncome.clientName === 'Client XYZ', 'Source should have client name.');
  assert(sourceIncome.currency === 'EUR', 'Source should be EUR currency.');
  assert(sourceIncome.exchangeRateEffectiveDate === '2026-04-01', 'Source date from fixture.');

  const duplicatedBundle = await duplicateIncomeInPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    {
      period,
      incomeId: sourceIncome.id,
    }
  );

  const duplicate = duplicatedBundle.incomes.find((i) => i.id !== sourceIncome.id);
  assert(duplicate !== undefined, 'Duplicate should exist.');
  assert(duplicate.invoiceNumber === '', 'Invoice number must be reset to empty for duplicate.');
  assert(
    duplicate.exchangeRateEffectiveDate !== sourceIncome.exchangeRateEffectiveDate,
    'Exchange rate date must be reset to current date.'
  );
  assert(duplicate.clientName === 'Client XYZ', 'Client name should be copied.');
  assert(duplicate.label === 'Contract B kopia', 'Label should have kopia suffix.');
  assert(duplicate.currency === 'EUR', 'Currency should be copied.');
  assert(duplicate.vatRate === 'NP', 'VAT rate should be copied.');
  assert(duplicate.baseAmount === 15000, 'Base amount should be copied.');
}

export async function testDeleteIncomeKeepsOtherPeriodsUntouched(): Promise<void> {
  const fixtures = createFixtures();
  const april = createMonthlyReportingPeriod(2026, 4);
  const may = createMonthlyReportingPeriod(2026, 5);
  const aprilBundle = await createIncomeForPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    {
      period: april,
      input: {
        label: 'April contract',
        description: '',
        baseAmount: 7000,
        billingType: 'MONTHLY',
        currency: 'PLN',
        vatRate: '23',
        clientName: '',
        invoiceNumber: '',
        workParameters: {
          workingDaysPerMonth: 21,
          workingHoursPerDay: 8,
        },
        exchangeRate: 1,
        exchangeRateSource: 'STATIC',
        exchangeRateEffectiveDate: '2026-04-01',
      },
    }
  );

  await createIncomeForPeriodUseCase(fixtures.calculatorRepository, fixtures.settingsRepository, {
    period: may,
    input: {
      label: 'May contract',
      description: '',
      baseAmount: 9000,
      billingType: 'MONTHLY',
      currency: 'PLN',
      vatRate: '23',
      clientName: '',
      invoiceNumber: '',
      workParameters: {
        workingDaysPerMonth: 21,
        workingHoursPerDay: 8,
      },
      exchangeRate: 1,
      exchangeRateSource: 'STATIC',
      exchangeRateEffectiveDate: '2026-04-01',
    },
  });

  const deletedBundle = await deleteIncomeFromPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    {
      period: april,
      incomeId: aprilBundle.incomes[0].id,
    }
  );
  const mayBundle = await loadIncomesForPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    may
  );

  assert(deletedBundle.incomes.length === 0, 'April income should be removed.');
  assert(deletedBundle.calculationSnapshot.revenueAmount === 0, 'April snapshot should be cleared.');
  assert(mayBundle.incomes.length === 1, 'May data must remain untouched.');
  assert(mayBundle.calculationSnapshot.revenueAmount === 9000, 'May snapshot must remain intact.');
}

export async function testCreateDailyIncomeUsesWorkingDays(): Promise<void> {
  const fixtures = createFixtures();
  const period = createMonthlyReportingPeriod(2026, 4);

  const bundle = await createIncomeForPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    {
      period,
      input: {
        label: 'Daily contract',
        description: '',
        baseAmount: 1200,
        billingType: 'DAILY',
        currency: 'PLN',
        vatRate: '23',
        clientName: '',
        invoiceNumber: '',
        workParameters: {
          workingDaysPerMonth: 18,
          workingHoursPerDay: 8,
        },
        exchangeRate: 1,
        exchangeRateSource: 'STATIC',
        exchangeRateEffectiveDate: '2026-04-01',
      },
    }
  );

  assert(
    bundle.calculationSnapshot.revenueAmount === 21600,
    'Daily income should normalize using working days.'
  );
}

export async function testCreateHourlyIncomeUsesFullWorkParameters(): Promise<void> {
  const fixtures = createFixtures();
  const period = createMonthlyReportingPeriod(2026, 4);

  const bundle = await createIncomeForPeriodUseCase(
    fixtures.calculatorRepository,
    fixtures.settingsRepository,
    {
      period,
      input: {
        label: 'Hourly contract',
        description: '',
        baseAmount: 180,
        billingType: 'HOURLY',
        currency: 'PLN',
        vatRate: '23',
        clientName: '',
        invoiceNumber: '',
        workParameters: {
          workingDaysPerMonth: 20,
          workingHoursPerDay: 8,
        },
        exchangeRate: 1,
        exchangeRateSource: 'STATIC',
        exchangeRateEffectiveDate: '2026-04-01',
      },
    }
  );

  assert(
    bundle.calculationSnapshot.revenueAmount === 28800,
    'Hourly income should normalize using days and hours.'
  );
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
  };

  return {
    calculatorRepository,
    settingsRepository,
    getSettings: () => settings,
    setSettings: (next: AppSettings) => {
      settings = next;
    },
  };
}

class InMemoryCalculatorRepository implements CalculatorRepository {
  private reportingPeriods = new Map<string, ReportingPeriod>();
  private settingsSnapshots = new Map<string, ReportingPeriodSettingsSnapshot>();
  private calculationSnapshots = new Map<string, MonthlyCalculationSnapshot>();
  private incomes = new Map<string, ReturnType<typeof createIncome>>();

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
      costs: [],
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

  async saveMonthlyCalculationSnapshot(snapshot: MonthlyCalculationSnapshot) {
    this.calculationSnapshots.set(snapshot.reportingPeriodId, snapshot);
    return snapshot;
  }

  async hasAnyIncomes(): Promise<boolean> {
    return this.incomes.size > 0;
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
