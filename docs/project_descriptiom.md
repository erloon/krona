# Business-Technical Analysis Document
## Target Application: Kalkulator B2B (B2B Calculator Module)
**Date:** March 24, 2026

### 1. Executive Summary
The analyzed application is a specialized financial calculator designed for Polish sole traders (B2B contractors - JDG). Its primary purpose is to calculate net monthly income by accurately deducting applicable taxes (PIT, VAT) and social security contributions (ZUS, Health contribution). The tool also features a comparison module (B2B vs. UoP - Employment Contract).

### 2. Functional Scope (Application Features)
The B2B calculator focuses on real-time net income estimation based on highly configurable user inputs. Key functionalities include:

* **Multi-Source Revenue Management:** Users can add and manage multiple independent B2B revenue streams. Each source is normalized to a monthly PLN value and aggregated for tax calculations. ZUS and health contribution are calculated once at entrepreneur level regardless of source count.
* **Time-Based Rate Conversion:** The calculator supports inputs as monthly, daily, or hourly rates, automatically converting them based on configurable billable days per month and hours per day.
* **Multi-Currency Support:** Income can be entered in various currencies (PLN, USD, EUR, GBP, CHF), with conversion to PLN using predefined or live NBP exchange rates (Table A). Each source retains its own rate, effective date, and rate source.
* **Advanced Tax Configuration:** Full support for the Polish tax system including Tax Scale / Skala podatkowa (12%/32%), Flat Tax / Podatek liniowy (19%), and Lump Sum / Ryczałt (rates: 2%, 3%, 5.5%, 8.5%, 12%, 14%, 15%, 17%).
* **ZUS (Social Security) Configuration:** Calculations adapt to the user's ZUS status: Brak ulgi (Standard), Składka preferencyjna (Preferential/Reduced), Ulga na start (Startup relief - social ZUS = 0), or Umowa o pracę (Employment Contract overlap - social ZUS = 0 under statutory conditions). FP/FS (Labor Fund) is applied only where statutory conditions are met.
* **Voluntary Sickness Insurance:** Optional 2.45% contribution available when the active ZUS status allows social insurance contributions from business activity.
* **Tax Reliefs & Benefits:**
  * **IP BOX** — Annual 5% PIT preference on qualified IP income, applied as an overlay on Tax Scale or Flat Tax. Uses the statutory nexus ratio formula: `((a+b)×1.3) / (a+b+c+d)`, capped at 1.0. Not available for Lump Sum.
  * **Return Relief / Ulga na powrót** — Exempts qualifying revenue up to 85,528 PLN/year from PIT for eligible taxpayers who transferred tax residency to Poland. Consumes the shared annual PIT-0 pool.
  * **Family Relief / Ulga dla rodzin 4+** — Exempts qualifying revenue up to 85,528 PLN/year from PIT for taxpayers with 4+ qualifying children. Shares the same annual PIT-0 cap with other zero-PIT reliefs.
  * **Joint Taxation with Spouse / Rozliczenie z małżonkiem** — Annual PIT optimization mechanism available only under Tax Scale. Combined eligible income is halved, taxed per scale, then doubled.
  * **Unpaid Holiday / Urlop bezpłatny** — Reduces billable revenue for planned non-billable days; fixed obligations (ZUS, health contribution) remain in force.
* **Cost Management:** Business expenses reduce the PIT and health contribution base under Tax Scale and Flat Tax. Under Lump Sum, costs affect only cash flow, not the tax base. Supports cost categories: Standard, Car - Mixed Use (50% VAT deductibility, 75% PIT deductibility), Car - Business Use (100% VAT and PIT deductibility).
* **VAT Settlement:** Per-source VAT rate selection (0%, 5%, 8%, 23%, NP). Output VAT (VAT należny) aggregated across sources; input VAT (VAT naliczony) from costs offsets the payable amount. VAT-exempt status disables VAT deduction. Supports Reverse Charge (NP) for cross-border B2B services.
* **B2B vs. UoP Comparison:** Side-by-side net income comparison between B2B and a standard employment contract (Umowa o Pracę), including employer-side costs (Super-Gross) and Copyright Costs (50% KUP) option.
* **Solidarity Levy (Danina Solidarnościowa):** Additional 4% levy on annual income exceeding 1,000,000 PLN, applicable under Tax Scale and Flat Tax.
* **Real-time Summary Dashboard:** Immediate calculation of deductions, providing a high-level view and an expandable detailed summary panel.
* **State Management:** Functionality to share the calculation (URL/state sharing) and reset all inputs.

### 3. User Interface (UI) Configuration
The UI is divided into several logical input/output blocks:

* **Result Dashboard (Top/Sticky):**
    * **Main Output:** "Net income per month" (Przychód netto miesięcznie).
    * **Deduction breakdown:** PIT, VAT, ZUS, and Health Contribution (Zdrowotna).
    * **Actions:** "Share" (Udostępnij), "Reset", "Expand detailed summary".
* **Incomes Section (Przychody B2B):**
    * List of current income sources with an "Add source" (Dodaj źródło przychodu) button.
    * Inputs per source: Amount, Currency dropdown (PLN/USD/EUR/GBP/CHF), VAT rate dropdown (0%, 5%, 8%, 23%, NP).
    * Billing mode tabs: Monthly / Daily / Hourly with corresponding Days/Month and Hours/Day adjusters.
    * Exchange rate display per source (rate source, effective date, resolved NBP rate).
* **Costs Section (Koszty prowadzenia działalności):**
    * "Add cost" (Dodaj koszt) button with inputs: Label, Net amount, VAT rate, Cost category (Standard / Car - Mixed Use / Car - Business Use).
* **Settings Panel (Ustawienia):**
    * *Radio buttons:* Tax form selection (Skala / Liniowy / Ryczałt), ZUS status selection (Brak ulgi / Składka preferencyjna / Ulga na start / Umowa o pracę).
    * *Checkboxes/Toggles:* Voluntary sickness insurance, IP BOX, Return relief (Ulga na powrót), Family relief 4+ (Ulga dla rodzin 4+), Joint taxation with spouse.
    * *Numeric Input:* "Save for holidays" (Odłóż na urlop) — number of unpaid days.
* **Detailed Summary Panel (Szczegółowe podsumowanie):**
    * Expandable step-by-step breakdown: gross revenue, VAT, expenses, ZUS social, health contribution, PIT base, PIT, solidarity levy, net income.
    * Annual and monthly views; threshold crossing indicators (e.g., 120k PLN Tax Scale bracket, 60k/300k PLN Lump Sum health tiers).
* **B2B vs. UoP Comparison Panel:**
    * Toggle to activate side-by-side view; inputs for UoP gross salary and author's rights percentage (KUP).

### 4. Core Calculation Pipeline
The engine processes inputs in the following order per calculation cycle:

1. **Revenue normalization** — time-based rate conversion (hourly/daily → monthly) per source.
2. **Currency conversion** — foreign revenue normalized to PLN using per-source NBP rates.
3. **Multi-source aggregation** — sources summed into total monthly PLN revenue.
4. **Unpaid holiday adjustment** — revenue reduced by lost billable days (business stays active).
5. **ZUS social calculation** — based on selected status; paid once at entrepreneur level.
6. **Health contribution calculation** — Tax Scale: 9% of income; Flat Tax: 4.9% of income (min. floor); Lump Sum: tiered by annual revenue (up to 60k / 60k–300k / above 300k PLN).
7. **Tax base computation** — Revenue minus costs minus deductible ZUS social; costs excluded from base under Lump Sum.
8. **PIT-0 relief application** — Return Relief and/or Family Relief 4+ applied chronologically against qualifying revenue (shared 85,528 PLN annual pool).
9. **IP BOX overlay** — annual 5% preferential estimate applied to nexus-adjusted qualified IP income (Tax Scale / Flat Tax only).
10. **PIT calculation** — Scale: 12%/32% with 3,600 PLN tax-reducing amount; Flat Tax: 19%; Lump Sum: selected rate on revenue.
11. **Joint settlement adjustment** — annual tax recalculated on combined halved base (Tax Scale only).
12. **Solidarity Levy** — 4% on annual surplus above 1,000,000 PLN (Tax Scale / Flat Tax).
13. **VAT settlement** — output VAT minus deductible input VAT from costs.
14. **Net income** — Revenue − expenses − ZUS social − health contribution − PIT − solidarity levy.

### 5. Data Structure (JSON State Model)
The underlying state managing the calculator resembles the following JSON schema:

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
        "vatRate": 0.23,
        "vatRateLabel": "23% | 8% | 5% | 0% | NP",
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
      "zusStatus": "NONE | PREFERENTIAL | STARTUP | UOP",
      "voluntarySicknessInsurance": false,
      "unpaidHolidayDays": 0,
      "jointTaxation": false,
      "jointTaxationSpouseAnnualIncome": 0.00,
      "ipBox": false,
      "ipBoxQualifiedIncomePercent": 0.0,
      "ipBoxCostsA": 0.00,
      "ipBoxCostsB": 0.00,
      "ipBoxCostsC": 0.00,
      "ipBoxCostsD": 0.00,
      "returnRelief": false,
      "familyRelief": false,
      "vatStatus": "ACTIVE | EXEMPT",
      "taxYear": 2026
    },
    "comparisonMode": {
      "enabled": false,
      "uopGrossSalary": 0.00,
      "uopAuthorRightsPercent": 0.0
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
