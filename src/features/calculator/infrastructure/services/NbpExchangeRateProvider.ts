import type { ExchangeRateProvider, ResolvedExchangeRate } from '@/features/calculator/application/services/ExchangeRateProvider';
import type { IncomeCurrency } from '@/features/calculator/domain/entities/income';

const NBP_BASE_URL = 'https://api.nbp.pl/api/exchangerates/rates/A';
const MAX_LOOKBACK_DAYS = 31;

type NbpRateResponse = Readonly<{
  rates: readonly Readonly<{
      effectiveDate: string;
      mid: number;
    }>[];
}>;

export class NbpExchangeRateProvider implements ExchangeRateProvider {
  async getRate(currency: IncomeCurrency, referenceDate: string): Promise<ResolvedExchangeRate> {
    if (currency === 'PLN') {
      return {
        currency,
        exchangeRate: 1,
        exchangeRateSource: 'STATIC',
        exchangeRateReferenceDate: referenceDate,
        exchangeRateEffectiveDate: referenceDate,
      };
    }

    assertIsoDate(referenceDate, 'referenceDate');

    for (let lookback = 0; lookback < MAX_LOOKBACK_DAYS; lookback += 1) {
      const probeDate = addDays(referenceDate, -lookback);
      const response = await fetch(
        `${NBP_BASE_URL}/${currency}/${probeDate}/?format=json`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (response.status === 404) {
        continue;
      }

      if (!response.ok) {
        throw new Error(`NBP rate request failed with status ${response.status}.`);
      }

      const payload = (await response.json()) as NbpRateResponse;
      const rate = payload.rates[0];

      if (!rate || !Number.isFinite(rate.mid) || rate.mid <= 0) {
        throw new Error(`NBP returned an invalid rate for ${currency} on ${probeDate}.`);
      }

      return {
        currency,
        exchangeRate: roundFxMoney(rate.mid),
        exchangeRateSource: 'NBP_TABLE_A',
        exchangeRateReferenceDate: referenceDate,
        exchangeRateEffectiveDate: rate.effectiveDate,
      };
    }

    throw new Error(`No NBP Table A rate found for ${currency} near ${referenceDate}.`);
  }
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function assertIsoDate(value: string, fieldName: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid ${fieldName} "${value}". Expected format YYYY-MM-DD.`);
  }
}

function roundFxMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}
