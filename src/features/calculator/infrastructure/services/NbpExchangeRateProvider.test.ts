import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { NbpExchangeRateProvider } from './NbpExchangeRateProvider';

describe('NbpExchangeRateProvider', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('short-circuits PLN to a static unit rate', async () => {
    const provider = new NbpExchangeRateProvider();
    const result = await provider.getRate('PLN', '2026-04-01');

    assert.equal(result.exchangeRate, 1);
    assert.equal(result.exchangeRateSource, 'STATIC');
    assert.equal(result.exchangeRateReferenceDate, '2026-04-01');
    assert.equal(result.exchangeRateEffectiveDate, '2026-04-01');
  });

  it('returns the published NBP rate for an exact date', async () => {
    globalThis.fetch = async () =>
      createJsonResponse({
        rates: [
          {
            effectiveDate: '2026-04-03',
            mid: 4.1234,
          },
        ],
      });

    const provider = new NbpExchangeRateProvider();
    const result = await provider.getRate('EUR', '2026-04-03');

    assert.equal(result.exchangeRate, 4.1234);
    assert.equal(result.exchangeRateReferenceDate, '2026-04-03');
    assert.equal(result.exchangeRateEffectiveDate, '2026-04-03');
  });

  it('falls back to the previous publication date when NBP returns 404', async () => {
    const requestedDates: string[] = [];

    globalThis.fetch = async (input) => {
      const url = String(input);
      requestedDates.push(url);

      if (url.includes('/2026-04-06/')) {
        return createEmptyResponse(404);
      }

      return createJsonResponse({
        rates: [
          {
            effectiveDate: '2026-04-05',
            mid: 4.2222,
          },
        ],
      });
    };

    const provider = new NbpExchangeRateProvider();
    const result = await provider.getRate('USD', '2026-04-06');

    assert.equal(result.exchangeRate, 4.2222);
    assert.equal(result.exchangeRateReferenceDate, '2026-04-06');
    assert.equal(result.exchangeRateEffectiveDate, '2026-04-05');
    assert.equal(requestedDates.length, 2);
  });

  it('throws on non-404 HTTP failures', async () => {
    globalThis.fetch = async () => createEmptyResponse(500);

    const provider = new NbpExchangeRateProvider();

    await assert.rejects(() => provider.getRate('CHF', '2026-04-02'), /status 500/i);
  });
});

function createJsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function createEmptyResponse(status: number): Response {
  return new Response(null, { status });
}
