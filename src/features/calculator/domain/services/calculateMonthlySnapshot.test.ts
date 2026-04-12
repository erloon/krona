import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createCost } from '@/features/calculator/domain/entities/cost';
import { createIncome } from '@/features/calculator/domain/entities/income';
import { createReportingPeriodSettingsSnapshot } from '@/features/calculator/domain/entities/reporting-period-settings-snapshot';

import { calculateMonthlySnapshot } from './calculateMonthlySnapshot';

describe('calculateMonthlySnapshot IP Box', () => {
  it('keeps monthly PIT standard and adds annual IP Box estimate', () => {
    const snapshot = calculateMonthlySnapshot({
      reportingPeriodId: 'reporting-period-2026-04',
      settingsSnapshot: createReportingPeriodSettingsSnapshot({
        reportingPeriodId: 'reporting-period-2026-04',
        taxYear: 2026,
        taxationForm: 'FLAT_19',
        lumpSumRate: '12',
        jointTaxation: false,
        jointTaxationSpouseAnnualIncome: '0',
        zusStatus: 'PREFERENTIAL',
        voluntarySicknessInsurance: false,
        vatStatus: 'ACTIVE',
        ipBox: true,
        ipBoxQualifiedIncomePercent: '100',
        ipBoxCostsA: '10000',
        ipBoxCostsB: '0',
        ipBoxCostsC: '0',
        ipBoxCostsD: '0',
        returnRelief: false,
        familyRelief: false,
      }),
      incomes: [
        createIncome({
          id: 'income-1',
          reportingPeriodId: 'reporting-period-2026-04',
          label: 'Income',
          description: '',
          billingType: 'MONTHLY',
          baseAmount: 20000,
          currency: 'PLN',
          vatRate: '23',
          workParameters: {
            workingDaysPerMonth: 21,
            workingHoursPerDay: 8,
          },
          exchangeRate: 1,
          exchangeRateSource: 'STATIC',
          exchangeRateEffectiveDate: '2026-04-01',
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        }),
      ],
      costs: [
        createCost({
          id: 'cost-1',
          reportingPeriodId: 'reporting-period-2026-04',
          label: 'Laptop',
          description: '',
          enteredNetAmount: 2000,
          currency: 'PLN',
          netAmount: 2000,
          vatRate: '23',
          category: 'STANDARD',
          exchangeRate: 1,
          exchangeRateSource: 'STATIC',
          exchangeRateEffectiveDate: '2026-04-01',
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        }),
      ],
    });

    assert.equal(snapshot.pitAmount, 3334.35);
    assert.equal(snapshot.annualBasePitAmount, 40012.68);
    assert.equal(snapshot.annualPitAfterIpBoxAmount, 10526.63);
    assert.equal(snapshot.annualIpBoxTaxGainAmount, 29486.05);
    assert.equal(snapshot.ipBoxNexusRatio, 1);
    assert.equal(snapshot.ipBoxWarning, null);
  });

  it('disables IP Box estimate when qualified costs are all zero', () => {
    const snapshot = calculateMonthlySnapshot({
      reportingPeriodId: 'reporting-period-2026-04',
      settingsSnapshot: createReportingPeriodSettingsSnapshot({
        reportingPeriodId: 'reporting-period-2026-04',
        taxYear: 2026,
        taxationForm: 'SCALE',
        lumpSumRate: '12',
        jointTaxation: false,
        jointTaxationSpouseAnnualIncome: '0',
        zusStatus: 'STANDARD',
        voluntarySicknessInsurance: false,
        vatStatus: 'ACTIVE',
        ipBox: true,
        ipBoxQualifiedIncomePercent: '80',
        ipBoxCostsA: '0',
        ipBoxCostsB: '0',
        ipBoxCostsC: '0',
        ipBoxCostsD: '0',
        returnRelief: false,
        familyRelief: false,
      }),
      incomes: [
        createIncome({
          id: 'income-1',
          reportingPeriodId: 'reporting-period-2026-04',
          label: 'Income',
          description: '',
          billingType: 'MONTHLY',
          baseAmount: 15000,
          currency: 'PLN',
          vatRate: '23',
          workParameters: {
            workingDaysPerMonth: 21,
            workingHoursPerDay: 8,
          },
          exchangeRate: 1,
          exchangeRateSource: 'STATIC',
          exchangeRateEffectiveDate: '2026-04-01',
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        }),
      ],
      costs: [],
    });

    assert.equal(snapshot.annualBasePitAmount, snapshot.annualPitAfterIpBoxAmount);
    assert.equal(snapshot.annualIpBoxTaxAmount, 0);
    assert.match(snapshot.ipBoxWarning ?? '', /kosztów kwalifikowanych A-D/i);
  });
});
