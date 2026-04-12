import type { MonthlyReportingPeriod } from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';
import { createCost, type Cost } from '@/features/calculator/domain/entities/cost';
import { createIncome, type Income } from '@/features/calculator/domain/entities/income';
import type { MonthlyCalculationSnapshot } from '@/features/calculator/domain/entities/monthly-calculation-snapshot';
import type { ReportingPeriod } from '@/features/calculator/domain/entities/reporting-period';
import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import type { ReportingPeriodSettingsSnapshot } from '@/features/calculator/domain/entities/reporting-period-settings-snapshot';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';
import { calculateMonthlySnapshot } from '@/features/calculator/domain/services/calculateMonthlySnapshot';
import { REPORTING_PERIOD_STATUS, createReportingPeriod } from '@/features/calculator/domain/entities/reporting-period';

import {
  createDefaultEmptyCalculationSnapshot,
  createDefaultReportingPeriodRecord,
  createReportingPeriodId,
} from '../mappers/calculatorRecordMapper';

const STORAGE_KEY = 'krona.calculator.report-periods';

type LocalStorageShape = {
  reportingPeriods: ReportingPeriod[];
  settingsSnapshots: ReportingPeriodSettingsSnapshot[];
  calculationSnapshots: MonthlyCalculationSnapshot[];
  incomes: Income[];
  costs: Cost[];
};

export class LocalStorageCalculatorRepository implements CalculatorRepository {
  async ensureReportingPeriod(
    period: MonthlyReportingPeriod,
    settingsSnapshot: ReportingPeriodSettingsSnapshot
  ): Promise<ReportingPeriod> {
    const storage = this.readStorage();
    const existing = storage.reportingPeriods.find(
      (candidate) => candidate.year === period.year && candidate.month === period.month
    );

    if (existing) {
      return existing;
    }

    const reportingPeriodId = createReportingPeriodId(period.year, period.month);
    const nextPeriod = createDefaultReportingPeriodRecord({
      id: reportingPeriodId,
      year: period.year,
      month: period.month,
    });

    storage.reportingPeriods.push(nextPeriod);
    storage.settingsSnapshots.push({
      ...settingsSnapshot,
      reportingPeriodId,
    });
    storage.calculationSnapshots.push(createDefaultEmptyCalculationSnapshot(reportingPeriodId));
    this.writeStorage(storage);

    return nextPeriod;
  }

  async getReportingPeriodBundle(period: MonthlyReportingPeriod): Promise<ReportingPeriodBundle> {
    const storage = this.readStorage();
    const reportingPeriod = storage.reportingPeriods.find(
      (candidate) => candidate.year === period.year && candidate.month === period.month
    );

    if (!reportingPeriod) {
      throw new Error(`Reporting period ${period.key} was not initialized.`);
    }

    const settingsSnapshot = storage.settingsSnapshots.find(
      (candidate) => candidate.reportingPeriodId === reportingPeriod.id
    );

    if (!settingsSnapshot) {
      throw new Error(`Reporting period ${period.key} is missing its settings snapshot.`);
    }

    const incomes = storage.incomes.filter(
      (candidate) => candidate.reportingPeriodId === reportingPeriod.id
    );
    const costs = storage.costs.filter((candidate) => candidate.reportingPeriodId === reportingPeriod.id);
    const calculationSnapshot = calculateMonthlySnapshot({
      reportingPeriodId: reportingPeriod.id,
      settingsSnapshot,
      incomes,
      costs,
    });

    await this.saveMonthlyCalculationSnapshot(calculationSnapshot);

    return {
      reportingPeriod,
      settingsSnapshot,
      calculationSnapshot,
      incomes,
      costs,
    };
  }

  async listReportingPeriods(): Promise<readonly ReportingPeriod[]> {
    const storage = this.readStorage();

    return [...storage.reportingPeriods].sort((left, right) => {
      if (left.year !== right.year) {
        return right.year - left.year;
      }

      return right.month - left.month;
    });
  }

  async saveIncome(income: Income): Promise<Income> {
    const storage = this.readStorage();
    const reportingPeriod = storage.reportingPeriods.find(
      (candidate) => candidate.id === income.reportingPeriodId
    );

    if (!reportingPeriod) {
      throw new Error(`Reporting period ${income.reportingPeriodId} does not exist.`);
    }

    const existingIndex = storage.incomes.findIndex((candidate) => candidate.id === income.id);

    if (existingIndex >= 0) {
      storage.incomes[existingIndex] = income;
    } else {
      storage.incomes.push(income);
    }

    this.writeStorage(storage);

    return income;
  }

  async deleteIncome(reportingPeriodId: string, incomeId: string): Promise<void> {
    const storage = this.readStorage();

    storage.incomes = storage.incomes.filter(
      (candidate) =>
        !(candidate.reportingPeriodId === reportingPeriodId && candidate.id === incomeId)
    );

    this.writeStorage(storage);
  }

  async saveCost(cost: Cost): Promise<Cost> {
    const storage = this.readStorage();
    const reportingPeriod = storage.reportingPeriods.find(
      (candidate) => candidate.id === cost.reportingPeriodId
    );

    if (!reportingPeriod) {
      throw new Error(`Reporting period ${cost.reportingPeriodId} does not exist.`);
    }

    const existingIndex = storage.costs.findIndex((candidate) => candidate.id === cost.id);

    if (existingIndex >= 0) {
      storage.costs[existingIndex] = cost;
    } else {
      storage.costs.push(cost);
    }

    this.writeStorage(storage);

    return cost;
  }

  async deleteCost(reportingPeriodId: string, costId: string): Promise<void> {
    const storage = this.readStorage();

    storage.costs = storage.costs.filter(
      (candidate) => !(candidate.reportingPeriodId === reportingPeriodId && candidate.id === costId)
    );

    this.writeStorage(storage);
  }

  async saveReportingPeriodSettingsSnapshot(
    snapshot: ReportingPeriodSettingsSnapshot
  ): Promise<ReportingPeriodSettingsSnapshot> {
    const storage = this.readStorage();
    const existingIndex = storage.settingsSnapshots.findIndex(
      (candidate) => candidate.reportingPeriodId === snapshot.reportingPeriodId
    );

    if (existingIndex >= 0) {
      storage.settingsSnapshots[existingIndex] = snapshot;
    } else {
      storage.settingsSnapshots.push(snapshot);
    }

    this.writeStorage(storage);

    return snapshot;
  }

  async saveMonthlyCalculationSnapshot(
    snapshot: MonthlyCalculationSnapshot
  ): Promise<MonthlyCalculationSnapshot> {
    const storage = this.readStorage();
    const existingIndex = storage.calculationSnapshots.findIndex(
      (candidate) => candidate.reportingPeriodId === snapshot.reportingPeriodId
    );

    if (existingIndex >= 0) {
      storage.calculationSnapshots[existingIndex] = snapshot;
    } else {
      storage.calculationSnapshots.push(snapshot);
    }

    this.writeStorage(storage);
    return snapshot;
  }

  async clearAllData(): Promise<void> {
    const storage = getStorage();
    storage?.removeItem(STORAGE_KEY);
  }

  async hasAnyIncomes(): Promise<boolean> {
    const storage = this.readStorage();
    return storage.incomes.length > 0;
  }

  async hasAnyCosts(): Promise<boolean> {
    const storage = this.readStorage();
    return storage.costs.length > 0;
  }

  private readStorage(): LocalStorageShape {
    const storage = getStorage();
    const rawValue = storage?.getItem(STORAGE_KEY);

    if (!rawValue) {
      return createEmptyStorage();
    }

    try {
      const parsed = JSON.parse(rawValue) as Partial<LocalStorageShape>;

      return {
        reportingPeriods: (parsed.reportingPeriods ?? [])
          .map((reportingPeriod) => migrateStoredReportingPeriod(reportingPeriod))
          .filter((reportingPeriod): reportingPeriod is ReportingPeriod => reportingPeriod !== null),
        settingsSnapshots: parsed.settingsSnapshots ?? [],
        calculationSnapshots: parsed.calculationSnapshots ?? [],
        incomes: (parsed.incomes ?? []).map((income) => migrateStoredIncome(income)),
        costs: (parsed.costs ?? []).map((cost) => migrateStoredCost(cost)),
      };
    } catch {
      return createEmptyStorage();
    }
  }

  private writeStorage(storageValue: LocalStorageShape) {
    const storage = getStorage();
    storage?.setItem(STORAGE_KEY, JSON.stringify(storageValue));
  }
}

function createEmptyStorage(): LocalStorageShape {
  return {
    reportingPeriods: [],
    settingsSnapshots: [],
    calculationSnapshots: [],
    incomes: [],
    costs: [],
  };
}

function getStorage() {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  return globalThis.localStorage;
}

function migrateStoredReportingPeriod(
  reportingPeriod: Partial<ReportingPeriod>
): ReportingPeriod | null {
  const parsedFromId = parseReportingPeriodParts(reportingPeriod.id);
  const year = reportingPeriod.year ?? parsedFromId?.year;
  const month = reportingPeriod.month ?? parsedFromId?.month;

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return null;
  }

  const normalizedYear = Number(year);
  const normalizedMonth = Number(month);

  return createReportingPeriod({
    id:
      reportingPeriod.id ??
      createReportingPeriodId(normalizedYear, normalizedMonth),
    year: normalizedYear,
    month: normalizedMonth,
    status: reportingPeriod.status ?? REPORTING_PERIOD_STATUS.open,
    createdAt: reportingPeriod.createdAt,
    updatedAt: reportingPeriod.updatedAt,
  });
}

function parseReportingPeriodParts(value?: string): { year: number; month: number } | null {
  if (!value) {
    return null;
  }

  const match = /^reporting-period-(\d{4})-(0[1-9]|1[0-2])$/.exec(value);

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
  };
}

function migrateStoredIncome(income: Partial<Income> & { netAmount?: number }): Income {
  return createIncome({
    id: income.id ?? `income-${Date.now()}`,
    reportingPeriodId: income.reportingPeriodId ?? '',
    label: income.label ?? '',
    description: income.description,
    billingType: income.billingType,
    baseAmount: income.baseAmount ?? income.netAmount ?? 0,
    currency: income.currency,
    vatRate: income.vatRate,
    workParameters: income.workParameters,
    exchangeRate: income.exchangeRate,
    exchangeRateSource: income.exchangeRateSource,
    exchangeRateReferenceDate: income.exchangeRateReferenceDate,
    exchangeRateEffectiveDate: income.exchangeRateEffectiveDate,
    lumpSumRate: income.lumpSumRate,
    ipBoxQualifiedIncomePercent: income.ipBoxQualifiedIncomePercent,
    isActive: income.isActive,
    clientName: income.clientName,
    invoiceNumber: income.invoiceNumber,
    createdAt: income.createdAt,
    updatedAt: income.updatedAt,
  });
}

function migrateStoredCost(cost: Partial<Cost> & { enteredNetAmount?: number }): Cost {
  return createCost({
    id: cost.id ?? `cost-${Date.now()}`,
    reportingPeriodId: cost.reportingPeriodId ?? '',
    label: cost.label ?? '',
    description: cost.description,
    enteredNetAmount: cost.enteredNetAmount,
    currency: cost.currency,
    netAmount: cost.netAmount ?? cost.enteredNetAmount ?? 0,
    vatRate: cost.vatRate,
    category: cost.category,
    exchangeRate: cost.exchangeRate,
    exchangeRateSource: cost.exchangeRateSource,
    exchangeRateReferenceDate: cost.exchangeRateReferenceDate,
    exchangeRateEffectiveDate: cost.exchangeRateEffectiveDate,
    attachment: cost.attachment,
    createdAt: cost.createdAt,
    updatedAt: cost.updatedAt,
  });
}
