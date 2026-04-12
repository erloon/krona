import { and, eq } from 'drizzle-orm';

import {
  costsTable,
  incomesTable,
  monthlyCalculationSnapshotsTable,
  reportingPeriodsTable,
  reportingPeriodSettingsSnapshotsTable,
} from '@/core/database/schema';
import type { DrizzleDatabase } from '@/core/database/client';
import type { Cost } from '@/features/calculator/domain/entities/cost';
import type { Income } from '@/features/calculator/domain/entities/income';
import type { MonthlyReportingPeriod } from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';
import { calculateMonthlySnapshot } from '@/features/calculator/domain/services/calculateMonthlySnapshot';
import type { MonthlyCalculationSnapshot } from '@/features/calculator/domain/entities/monthly-calculation-snapshot';
import type { ReportingPeriodBundle } from '@/features/calculator/domain/entities/reporting-period-bundle';
import type { ReportingPeriodSettingsSnapshot } from '@/features/calculator/domain/entities/reporting-period-settings-snapshot';
import type { CalculatorRepository } from '@/features/calculator/domain/repositories/CalculatorRepository';

import {
  createDefaultEmptyCalculationSnapshot,
  createDefaultReportingPeriodRecord,
  createReportingPeriodId,
  fromCostRecord,
  fromIncomeRecord,
  fromMonthlyCalculationSnapshotRecord,
  fromReportingPeriodRecord,
  fromReportingPeriodSettingsSnapshotRecord,
  toCostRecord,
  toIncomeRecord,
  toMonthlyCalculationSnapshotRecord,
  toReportingPeriodRecord,
  toReportingPeriodSettingsSnapshotRecord,
} from '../mappers/calculatorRecordMapper';

export class SQLiteCalculatorRepository implements CalculatorRepository {
  constructor(private readonly database: DrizzleDatabase) {}

  async ensureReportingPeriod(
    period: MonthlyReportingPeriod,
    settingsSnapshot: ReportingPeriodSettingsSnapshot
  ) {
    const existingPeriod = await this.findReportingPeriod(period);

    if (existingPeriod) {
      return existingPeriod;
    }

    const reportingPeriodId = createReportingPeriodId(period.year, period.month);
    const nextPeriod = createDefaultReportingPeriodRecord({
      id: reportingPeriodId,
      year: period.year,
      month: period.month,
    });
    const nextSettingsSnapshot = {
      ...settingsSnapshot,
      reportingPeriodId,
    };

    await this.database.insert(reportingPeriodsTable).values(toReportingPeriodRecord(nextPeriod));
    await this.database
      .insert(reportingPeriodSettingsSnapshotsTable)
      .values(toReportingPeriodSettingsSnapshotRecord(nextSettingsSnapshot));
    await this.database
      .insert(monthlyCalculationSnapshotsTable)
      .values(toMonthlyCalculationSnapshotRecord(createDefaultEmptyCalculationSnapshot(reportingPeriodId)));

    return nextPeriod;
  }

  async getReportingPeriodBundle(period: MonthlyReportingPeriod): Promise<ReportingPeriodBundle> {
    const reportingPeriod = await this.findReportingPeriod(period);

    if (!reportingPeriod) {
      throw new Error(`Reporting period ${period.key} was not initialized.`);
    }

    const [settingsRecord, calculationRecord, incomeRecords, costRecords] = await Promise.all([
      this.database.query.reportingPeriodSettingsSnapshotsTable.findFirst({
        where: eq(reportingPeriodSettingsSnapshotsTable.reportingPeriodId, reportingPeriod.id),
      }),
      this.database.query.monthlyCalculationSnapshotsTable.findFirst({
        where: eq(monthlyCalculationSnapshotsTable.reportingPeriodId, reportingPeriod.id),
      }),
      this.database.query.incomesTable.findMany({
        where: eq(incomesTable.reportingPeriodId, reportingPeriod.id),
        orderBy: (fields, operators) => operators.desc(fields.createdAt),
      }),
      this.database.query.costsTable.findMany({
        where: eq(costsTable.reportingPeriodId, reportingPeriod.id),
        orderBy: (fields, operators) => operators.desc(fields.createdAt),
      }),
    ]);

    if (!settingsRecord) {
      throw new Error(`Reporting period ${period.key} is missing its settings snapshot.`);
    }

    const settingsSnapshot = fromReportingPeriodSettingsSnapshotRecord(settingsRecord);
    const incomes = incomeRecords.map(fromIncomeRecord);
    const costs = costRecords.map(fromCostRecord);
    const recalculatedSnapshot = calculateMonthlySnapshot({
      reportingPeriodId: reportingPeriod.id,
      settingsSnapshot,
      incomes,
      costs,
    });

    const persistedSnapshot = await this.saveMonthlyCalculationSnapshot(recalculatedSnapshot);

    return {
      reportingPeriod,
      settingsSnapshot,
      calculationSnapshot: calculationRecord
        ? fromMonthlyCalculationSnapshotRecord({
            ...calculationRecord,
            payload: toMonthlyCalculationSnapshotRecord(persistedSnapshot).payload,
            calculatedAt: persistedSnapshot.calculatedAt,
          })
        : persistedSnapshot,
      incomes,
      costs,
    };
  }

  async saveIncome(income: Income): Promise<Income> {
    const existingPeriod = await this.database.query.reportingPeriodsTable.findFirst({
      where: eq(reportingPeriodsTable.id, income.reportingPeriodId),
    });

    if (!existingPeriod) {
      throw new Error(`Reporting period ${income.reportingPeriodId} does not exist.`);
    }

    const record = toIncomeRecord(income);

    await this.database
      .insert(incomesTable)
      .values(record)
      .onConflictDoUpdate({
        target: incomesTable.id,
        set: {
          label: record.label,
          description: record.description,
          billingType: record.billingType,
          baseAmount: record.baseAmount,
          currency: record.currency,
          vatRate: record.vatRate,
          workingDaysPerMonth: record.workingDaysPerMonth,
          workingHoursPerDay: record.workingHoursPerDay,
          exchangeRate: record.exchangeRate,
          exchangeRateSource: record.exchangeRateSource,
          exchangeRateEffectiveDate: record.exchangeRateEffectiveDate,
          lumpSumRate: record.lumpSumRate,
          ipBoxQualifiedIncomePercent: record.ipBoxQualifiedIncomePercent,
          isActive: record.isActive,
          clientName: record.clientName,
          invoiceNumber: record.invoiceNumber,
          updatedAt: record.updatedAt,
        },
      });

    return income;
  }

  async deleteIncome(reportingPeriodId: string, incomeId: string): Promise<void> {
    await this.database
      .delete(incomesTable)
      .where(and(eq(incomesTable.reportingPeriodId, reportingPeriodId), eq(incomesTable.id, incomeId)));
  }

  async saveCost(cost: Cost): Promise<Cost> {
    const existingPeriod = await this.database.query.reportingPeriodsTable.findFirst({
      where: eq(reportingPeriodsTable.id, cost.reportingPeriodId),
    });

    if (!existingPeriod) {
      throw new Error(`Reporting period ${cost.reportingPeriodId} does not exist.`);
    }

    const record = toCostRecord(cost);

    await this.database
      .insert(costsTable)
      .values(record)
      .onConflictDoUpdate({
        target: costsTable.id,
        set: {
          label: record.label,
          description: record.description,
          netAmount: record.netAmount,
          vatRate: record.vatRate,
          category: record.category,
          updatedAt: record.updatedAt,
        },
      });

    return cost;
  }

  async deleteCost(reportingPeriodId: string, costId: string): Promise<void> {
    await this.database
      .delete(costsTable)
      .where(and(eq(costsTable.reportingPeriodId, reportingPeriodId), eq(costsTable.id, costId)));
  }

  async saveMonthlyCalculationSnapshot(
    snapshot: MonthlyCalculationSnapshot
  ): Promise<MonthlyCalculationSnapshot> {
    const record = toMonthlyCalculationSnapshotRecord(snapshot);

    await this.database
      .insert(monthlyCalculationSnapshotsTable)
      .values(record)
      .onConflictDoUpdate({
        target: monthlyCalculationSnapshotsTable.reportingPeriodId,
        set: {
          version: record.version,
          payload: record.payload,
          calculatedAt: record.calculatedAt,
        },
      });

    return snapshot;
  }

  async hasAnyIncomes(): Promise<boolean> {
    const record = await this.database.query.incomesTable.findFirst({
      columns: {
        id: true,
      },
    });

    return record !== undefined;
  }

  async hasAnyCosts(): Promise<boolean> {
    const record = await this.database.query.costsTable.findFirst({
      columns: {
        id: true,
      },
    });

    return record !== undefined;
  }

  private async findReportingPeriod(period: MonthlyReportingPeriod) {
    const record = await this.database.query.reportingPeriodsTable.findFirst({
      where: and(
        eq(reportingPeriodsTable.year, period.year),
        eq(reportingPeriodsTable.month, period.month)
      ),
    });

    return record ? fromReportingPeriodRecord(record) : null;
  }
}
