import type { MonthlyReportingPeriod } from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';
import type { Cost } from '@/features/calculator/domain/entities/cost';
import type { Income } from '@/features/calculator/domain/entities/income';
import type { MonthlyCalculationSnapshot } from '@/features/calculator/domain/entities/monthly-calculation-snapshot';
import type { ReportingPeriod } from '@/features/calculator/domain/entities/reporting-period';
import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import type { ReportingPeriodSettingsSnapshot } from '@/features/calculator/domain/entities/reporting-period-settings-snapshot';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';
import { calculateMonthlySnapshot } from '@/features/calculator/domain/services/calculateMonthlySnapshot';

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

  private readStorage(): LocalStorageShape {
    const storage = getStorage();
    const rawValue = storage?.getItem(STORAGE_KEY);

    if (!rawValue) {
      return createEmptyStorage();
    }

    try {
      const parsed = JSON.parse(rawValue) as Partial<LocalStorageShape>;

      return {
        reportingPeriods: parsed.reportingPeriods ?? [],
        settingsSnapshots: parsed.settingsSnapshots ?? [],
        calculationSnapshots: parsed.calculationSnapshots ?? [],
        incomes: parsed.incomes ?? [],
        costs: parsed.costs ?? [],
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
