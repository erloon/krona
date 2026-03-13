# Functional Specification: Currency Conversion Module

## 1. Executive Summary
The Currency Conversion Module within the Kalkulator B2B application enables independent contractors (JDG) to input their monthly, daily, or hourly revenue in supported foreign currencies and automatically normalize that revenue into Polish Złoty (PLN). In the current public calculator context, the currency selector is publicly exposed with PLN, USD, EUR, GBP, and CHF, together with example exchange-rate labels directly in the UI snippet. 0

Since Polish tax and contribution settlements are ultimately evaluated in PLN, this module acts as a mandatory normalization layer between user-entered contract values and downstream statutory calculations. The feature must therefore support both:
1. **Fast estimation mode** for calculator usability, and
2. **Legally-aware conversion logic** for realistic simulation of Polish B2B settlements.

The module must not attempt to replace accounting software or determine tax-event timing by itself. Its responsibility is to convert user-entered foreign-currency revenue into a transparent, traceable PLN value using a clearly defined exchange-rate source, effective date, and rounding policy. For Polish tax purposes, foreign-currency revenue is generally converted using the average NBP rate from the last business day preceding the day the revenue is obtained. NBP Table A is published on business days, typically between 11:45 and 12:15, and historical tables are available through the archive. 1

## 2. Input & Configuration Parameters

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **Base Currency** | PLN, USD, EUR, GBP, CHF | Defines the currency of the raw revenue input. Selecting a foreign currency activates the exchange-rate conversion workflow. Unsupported currencies must not be silently approximated or mapped. |
| **Revenue Amount** | Numeric value (> 0) | The amount earned in the selected base currency. The module must accept decimal values and preserve sufficient internal precision before rounding to PLN display values. |
| **Exchange Rate** | System-defined multiplier or user-entered custom rate (if manual override is allowed) | Converts the foreign-currency amount into PLN. If a custom rate is used, the UI must mark the calculation as estimate/custom rather than standard system-based conversion. |
| **Exchange Rate Source** | Static application rate, NBP Table A current rate, NBP historical archived rate, Custom override | Determines where the multiplier comes from and whether the result is only an estimate or a date-specific simulation. The source must be visible to the user. |
| **Exchange Rate Effective Date** | Current estimate date, user-selected revenue date, user-selected invoice/revenue reference date | Determines which historical/business-day rate is applicable. For date-aware calculations, the engine must resolve the last business day preceding the selected date rather than using the same-day rate. |
| **Rate Lock Scope** | Per revenue source | In multi-source scenarios, each source must retain its own currency, rate, source, and effective date. Rates must not be globally overwritten across all sources unless the user explicitly applies a shared rate policy. |
| **Rounding Policy** | Internal precision min. 4 decimal places for rates; output display in 2 decimal places (PLN grosze) | Prevents visible inconsistencies between line items and totals. The module must define whether rounding occurs line-by-line, at aggregation, or both. |
| **Rate Availability State** | Available, Pending publication, Historical fallback, Unavailable | Controls UX when the NBP rate for the intended date is not yet published or cannot be fetched. The system must show the fallback behavior explicitly. |

## 3. Core Functional Logic
* **Immediate Conversion Engine:** Upon entering an amount and selecting a non-PLN currency, the system immediately calculates the PLN equivalent using the formula: `PLN Revenue = Foreign Currency Amount × Exchange Rate`.

* **Date-Aware Rate Resolution:**  
  When the calculation is intended to simulate a legally realistic Polish settlement, the engine must:
  1. Determine the relevant business event date configured for the source.
  2. Resolve the **last business day preceding that date**.
  3. Retrieve the corresponding NBP average rate for that currency and date.
  4. Use that rate for PLN conversion.  
  The module must not default to the current day’s rate if the effective date implies a historical rate. 2

* **NBP Publication Window Handling:**  
  Because NBP Table A is published on business days between approximately 11:45 and 12:15, the module must handle “today before publication” as a special state. In such a case, the system should either:
  * use the last published business-day rate and label it clearly, or
  * block date-specific conversion until the new table is available.  
  Silent same-day assumptions are not acceptable. 3

* **Weekend / Holiday Fallback Logic:**  
  If the selected effective date falls on a non-business day, or if no NBP table exists for that date, the module must automatically step backward to the nearest prior business day with a published NBP rate. This fallback must be displayed in the UI together with the resolved rate date.

* **Multi-Source Aggregation:**  
  If a user configures multiple revenue streams (e.g., Source 1 in USD, Source 2 in EUR), the module must convert each stream independently into PLN using that stream’s own effective date and rate metadata, and only then aggregate them into `Total Monthly Revenue in PLN`.  
  **Rule:** foreign-currency values must never be aggregated across currencies first and converted later.

* **Downstream Data Flow:**  
  The converted PLN total is directly injected into the core tax calculation engine. It becomes the basis for calculating:
  * Health Contribution (Składka Zdrowotna),
  * PIT-related thresholds and liabilities,
  * any PLN-based comparisons required elsewhere in the calculator.  
  The currency module is responsible only for normalization into PLN; downstream interpretation remains outside this module.

* **Hourly/Daily Rate Normalization:**  
  If the user inputs an hourly or daily rate in a foreign currency along with the number of hours/days, the module must first calculate the total monthly revenue **in the source currency**, and only then apply the exchange rate:
  * `Monthly Foreign Revenue = Hourly Rate × Hours/Day × Days/Month`
  * `PLN Revenue = Monthly Foreign Revenue × Exchange Rate`  
  The conversion order must not be reversed.

* **Precision and Rounding Workflow:**  
  To minimize drift:
  1. Rates should be stored with at least 4 decimal places.
  2. Intermediate conversion calculations should keep higher precision internally.
  3. PLN display values should be rounded to 2 decimal places.
  4. The aggregation strategy must be deterministic, so the sum of displayed source values and the displayed total do not materially conflict.

* **Manual Override Workflow (if supported):**  
  If the user overrides the exchange rate manually:
  * the source must switch to `Custom`,
  * the UI must show a warning/badge such as `Custom rate`,
  * shared links / persisted calculator state must serialize that custom rate and effective date,
  * downstream recalculation must use the override consistently until changed by the user.

## 4. Output & Reporting Metrics

| Output Metric | Description |
| :--- | :--- |
| **Exchange Rate Display** | A UI element indicating the exact conversion rate being applied, including currency pair, effective date, and preferably rate source (e.g., `USD → PLN, NBP Table A, 2026-03-12, 1 USD = 3.7277 PLN` or `Custom rate`). |
| **Resolved Rate Date** | A visible audit field showing the actual business day used for the rate, especially when the user-selected date falls on a weekend, holiday, or pre-publication window. |
| **Per-Source Converted Revenue (PLN)** | Each revenue stream must expose its own converted PLN amount so users can verify the impact of mixed currencies and different rate dates. |
| **Total Converted Revenue (PLN)** | The overall gross or net revenue displayed in the top summary banner, after all relevant foreign inputs are normalized individually into PLN. |
| **Statutory Obligations (PLN)** | Values for PIT, VAT, ZUS, and Health Contributions are output strictly in PLN based on the converted revenue base. The currency module must provide consistent input values to these downstream calculations. |
| **Net Income (PLN)** | The final monthly take-home pay, rendered exclusively in PLN, factoring in all converted revenues and PLN-based business costs. |
| **Rate Status / Warning State** | Informational output indicating whether the result is based on current estimate data, historical NBP data, fallback to last published rate, or a custom manual rate. |

## 5. Business Rules & Constraints
* **Statutory Currency Mandate:** All backend calculations for taxes and ZUS **must** process in PLN. The system must strictly prevent tax thresholds, health contribution tiers, or summary totals from being evaluated directly against foreign-currency values.

* **Legally-Aware Conversion Rule:** For realistic Polish tax simulation, foreign-currency revenue should be converted using the average NBP rate from the last business day preceding the day of revenue recognition. The module must therefore support an effective-date concept and may not rely only on “today’s visible rate.” 4

* **Estimation vs. Settlement Constraint:** The calculator is an estimation tool. If the module operates on static or cached rates, the UI must explicitly communicate that the value is indicative and may differ from the legally applicable accounting/tax conversion.

* **No Implicit VAT Assumptions Based on Currency Alone:** Entering a foreign currency must not automatically force export-of-services VAT logic, reverse charge, or a 0% VAT setting. Currency and VAT treatment are related in practice but are not equivalent. The module should only convert values; VAT classification remains controlled elsewhere. Poland also permits, under separate VAT rules, alignment of VAT exchange-rate treatment with income-tax conversion rules, but that election should not be silently inferred by this module. 5

* **Cost Subtraction Rule:** Business costs are subtracted from the converted PLN revenue total, not from the foreign-currency base. The module must therefore finalize revenue normalization before any cross-module cost or profit operations are applied.

* **No Cross-Currency Netting:** The system must not combine USD, EUR, GBP, or CHF figures before conversion. Each currency line must be converted independently and auditable.

* **Historical Integrity Rule:** If the user shares the calculator state, saves the scenario, or reloads the page, the module should preserve the exact rate, rate source, and effective date used for the calculation. Otherwise, repeated opening of the same scenario may yield inconsistent totals.

* **Unavailable Rate Handling:** If the system cannot obtain a valid rate for a selected source/date/currency combination, it must not silently substitute an arbitrary value. The system should either:
  * fall back using an explicit rule,
  * prompt the user to select another date, or
  * request a manual rate.

* **Validation Constraints:**  
  * Revenue amount must be greater than zero.  
  * Exchange rate must be greater than zero.  
  * Manual rate override must reject non-numeric, zero, or negative values.  
  * Effective date must not be in an invalid format.  
  * Currency selection must be mandatory for every non-PLN source.

## Expert Recommendations & Edge Cases
1. **Add an explicit `Effective Rate Date` field per source.**  
   This is the single biggest functional gap in the original specification. Without it, the feature remains only a rough estimator and cannot realistically model Polish foreign-currency revenue recognition.

2. **Display the exchange-rate source and resolved business day in the UI.**  
   Showing only `USD - 1 = X PLN` is not sufficient for trust. The user should also see whether the rate came from a current estimate, archived NBP table, or manual override. The NBP publication schedule and archive support this behavior cleanly. 6

3. **Support per-source rate locking in multi-source scenarios.**  
   A contractor may have:
   * one invoice in EUR issued earlier in the month,
   * another invoice in USD on a different date,
   * and a PLN retainer.  
   Using one global FX multiplier would materially distort the result.

4. **Clarify weekend, bank-holiday, and pre-publication behavior.**  
   The module should clearly explain:  
   * “Rate for selected date unavailable; using previous business day,” or  
   * “Today’s NBP table not published yet; using last published table.”  
   This prevents silent errors and improves credibility.

5. **Define a strict rounding policy.**  
   The original document does not define where rounding happens. That creates audit noise, especially with multiple income sources. The recommended rule is:
   * keep high internal precision,
   * round displayed PLN amounts to 2 decimals,
   * aggregate from internally precise values,
   * display source-level values and total consistently.

6. **Mark custom/manual rates visually and persist them in shared state.**  
   Without a visible `Custom rate` badge, users may forget that they are no longer using standard calculator assumptions.

7. **Do not auto-derive VAT treatment from foreign currency.**  
   A foreign-currency invoice often correlates with cross-border services, but not always. The module should remain neutral and only normalize currency.

8. **Edge case: invoice date vs. revenue date confusion.**  
   Users often think the invoice date alone determines the rate. The module should help with a tooltip explaining that the relevant date depends on the legal/business event being simulated, and that the calculator is an estimator unless the exact accounting interpretation is known.

9. **Edge case: correction invoices / historical recalculation.**  
   If the product later supports corrections, the currency module should reuse the original historical rate context or explicitly ask the user for the correction rule. It must not blindly recalculate old revenue with today’s rate.

10. **Edge case: missing rate for unsupported or future-dated scenarios.**  
    If the user selects a future date or a currency outside supported scope, the module should not fabricate a forecast rate. It should either block the action or require explicit manual input.

11. **Edge case: mixed monthly and time-based inputs in different currencies.**  
    The system must preserve the order of operations:
    * normalize time-based quantity in source currency first,
    * then apply the FX conversion,
    * then aggregate to PLN.  
    Reversing this order would create avoidable inconsistencies.

12. **Edge case: stale static rates in public UI.**  
    Because the publicly visible search snippet shows fixed rate labels in the currency selector, the specification should explicitly require source/date transparency and freshness handling rather than assuming that a hard-coded visible rate is always acceptable.