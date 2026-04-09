# Project Description: Kalkulator B2B
**Date:** March 24, 2026

## Overview
A mobile app for Polish sole traders (JDG / B2B contractors) to estimate their real monthly net income ("na rękę"). The app instantly calculates all mandatory deductions — PIT, VAT, ZUS social contributions and health insurance — based on the user's contract value and personal tax situation.

---

## Core Features

### 1. Revenue Input
- Add one or more B2B income sources independently
- Per source: enter amount as **monthly, daily or hourly rate**
- Configurable billable days/month and hours/day
- Supported currencies: **PLN, USD, EUR, GBP, CHF** with NBP Table A exchange rates
- Per-source VAT rate: **0%, 5%, 8%, 23%, NP** (not taxable — reverse charge for EU/international)

### 2. Business Costs
- Add any number of expense items (label + net amount + VAT rate)
- Cost categories affecting VAT and PIT deductibility:
  - **Standard** — full VAT deduction (if VAT-registered), full PIT deduction
  - **Car – Mixed Use** — 50% VAT deduction, 75% PIT deduction
  - **Car – Business Only** — 100% VAT deduction, 100% PIT deduction
- Under Lump Sum (Ryczałt), costs do **not** reduce the tax base (only affect cash flow)

### 3. Tax Form Selection
Choose one of three Polish tax regimes:

| Form | Rate | Health contribution |
|---|---|---|
| Tax Scale (Skala podatkowa) | 12% / 32% (above 120k PLN) | 9% of income |
| Flat Tax (Podatek liniowy) | 19% flat | 4.9% of income (min. floor applies) |
| Lump Sum (Ryczałt) | 2% – 17% (by activity type) | Fixed tier by annual revenue |

**Lump Sum health contribution tiers (2026):** up to 60k PLN / 60k–300k PLN / above 300k PLN

### 4. ZUS (Social Security) Status
Selects the contribution scheme — one status active at a time:

| Status | Social ZUS | Notes |
|---|---|---|
| Brak ulgi (Standard) | Full base (~60% avg. wage) | FP/FS applies where conditions are met |
| Składka preferencyjna | Reduced base (~30% min. wage) | Temporary, up to 24 months |
| Ulga na start | 0 PLN | Health contribution still due; up to 6 months |
| Umowa o pracę | 0 PLN | Only when employment covers social insurance threshold |

**Voluntary sickness insurance** (+2.45%) available under Brak ulgi and Składka preferencyjna.

### 5. Tax Reliefs
All reliefs affect **PIT only** — ZUS and health contribution remain unchanged.

- **IP BOX** — 5% annual PIT rate on qualified IP income (software copyright). Applied as year-end overlay on Tax Scale or Flat Tax using the statutory nexus ratio. Not available under Lump Sum.
- **Ulga na powrót (Return Relief)** — PIT exemption on up to 85,528 PLN/year of qualifying revenue, for taxpayers who transferred tax residency to Poland. Part of a shared annual PIT-0 pool.
- **Ulga dla rodzin 4+ (Family Relief)** — PIT exemption on up to 85,528 PLN/year of qualifying revenue, for taxpayers with 4+ qualifying children. Shares the same 85,528 PLN annual cap as other PIT-0 reliefs.
- **Rozliczenie z małżonkiem (Joint Taxation)** — Annual PIT optimisation available under Tax Scale only. Combined household income is halved, taxed per scale, then doubled. Most beneficial when spouses' incomes differ significantly.
- **Unpaid holiday (Urlop bezpłatny)** — Enter planned non-billable days to see the impact on monthly revenue. Fixed obligations (ZUS, health contribution) stay in force.

### 6. VAT Settlement
- Output VAT (VAT należny) collected per invoice source
- Input VAT (VAT naliczony) from business costs offsets the payable amount
- Result: **VAT to pay** or **VAT surplus** (carry-forward / refund candidate)
- VAT-exempt users: VAT deduction disabled; undeductible VAT increases cost base

### 7. Result Dashboard (sticky, real-time)
Displays instantly on every input change:
- **Net income per month** (Przychód netto miesięcznie) — the main headline figure
- Breakdown: **PIT · VAT · ZUS · Zdrowotna**
- Actions: Share (URL state), Reset

### 8. Detailed Summary Panel
Expandable step-by-step breakdown showing the full calculation path:
- Gross revenue → VAT → Costs → ZUS social → Health contribution → Tax base → PIT → **Net income**
- Annual and monthly views
- Threshold indicators: 120k PLN Tax Scale bracket, 60k/300k PLN Lump Sum health tiers, 1M PLN Solidarity Levy threshold

---

## Calculation Pipeline (order of operations)

1. Time-based rate conversion (hourly / daily → monthly) per source
2. Currency conversion to PLN (per-source NBP rate)
3. Multi-source revenue aggregation
4. Unpaid holiday revenue reduction
5. ZUS social contributions (once per entrepreneur)
6. Health contribution (per selected tax form)
7. Tax base: revenue − costs − deductible ZUS (costs excluded under Lump Sum)
8. PIT-0 reliefs applied chronologically to qualifying revenue (shared 85,528 PLN cap)
9. IP BOX annual estimate (Tax Scale / Flat Tax only)
10. PIT: 12%/32% or 19% on income, or Ryczałt rate on revenue
11. Joint settlement recalculation (Tax Scale only)
12. Solidarity Levy: 4% on annual income above 1,000,000 PLN (Scale / Flat Tax)
13. VAT settlement: output VAT − input VAT from costs
14. **Net income = Revenue − Costs − ZUS − Health − PIT − Solidarity Levy**

---

## Data State Model (JSON)

```json
{
  "calculatorState": {
    "incomes": [
      {
        "id": "uuid-string",
        "label": "Source 1",
        "billingType": "MONTHLY | DAILY | HOURLY",
        "baseAmount": 10000.00,
        "currency": "PLN | USD | EUR | GBP | CHF",
        "vatRate": "23% | 8% | 5% | 0% | NP",
        "workingDaysPerMonth": 21,
        "workingHoursPerDay": 8,
        "exchangeRate": 1.0,
        "exchangeRateSource": "NBP_TABLE_A | CUSTOM | STATIC",
        "exchangeRateEffectiveDate": "2026-03-24"
      }
    ],
    "costs": [
      {
        "id": "uuid-string",
        "label": "Cost label",
        "netAmount": 0.00,
        "vatRate": 0.23,
        "category": "STANDARD | CAR_MIXED | CAR_BUSINESS"
      }
    ],
    "taxSettings": {
      "taxationForm": "SCALE | FLAT_19 | LUMP_SUM",
      "lumpSumRate": 0.12,
      "zusStatus": "STANDARD | PREFERENTIAL | STARTUP | UOP",
      "voluntarySicknessInsurance": false,
      "unpaidHolidayDays": 0,
      "vatStatus": "ACTIVE | EXEMPT",
      "taxYear": 2026,
      "ipBox": false,
      "ipBoxQualifiedIncomePercent": 0.0,
      "ipBoxCostsA": 0.00,
      "ipBoxCostsB": 0.00,
      "ipBoxCostsC": 0.00,
      "ipBoxCostsD": 0.00,
      "returnRelief": false,
      "familyRelief": false,
      "jointTaxation": false,
      "jointTaxationSpouseAnnualIncome": 0.00
    }
  },
  "calculatedResults": {
    "grossRevenue": 10000.00,
    "netIncome": 6787.25,
    "deductions": {
      "pit": 685.41,
      "vat": 2300.00,
      "zusTotal": 1788.29,
      "healthContribution": 739.05,
      "solidarityLevy": 0.00
    },
    "vatDetails": {
      "outputVat": 2300.00,
      "inputVat": 0.00,
      "vatPayable": 2300.00
    }
  }
}
```
