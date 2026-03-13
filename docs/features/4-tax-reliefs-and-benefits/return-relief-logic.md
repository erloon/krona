# Functional Specification: Return Relief Logic (Ulga na powrót)

## 1. Executive Summary
The "Return Relief" (Ulga na powrót) logic is a specialized tax calculation module within the B2B calculator designed to model the financial impact of the Polish statutory tax relief for returning expatriates. Its core business value is to provide accurate net income forecasting for entrepreneurs relocating their tax residency to Poland. By zeroing out the personal income tax (PIT) on the first 85,528 PLN of annual income, this feature allows users to dynamically see the cash-flow benefits, month-over-month tax threshold breaches, and the interaction of this relief with different taxation models (Tax Scale, Flat Rate, Lump Sum) over a given calendar year.

## 2. Input & Configuration Parameters

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **Return Relief Toggle** | `Yes` / `No` (Boolean) | Activates or deactivates the application of the 85,528 PLN tax-free allowance specifically designated for the return relief. |
| **Form of Taxation** | `Tax Scale` (Zasady ogólne), `Flat Tax` (Podatek liniowy), `Lump Sum` (Ryczałt) | Determines the base rules for calculating tax once the 85,528 PLN threshold is exceeded, and dictates how the relief interacts with the standard tax-free allowance (Kwota wolna od podatku). |
| **Monthly Revenue** | Numeric value (PLN) | Serves as the primary gross inflow used to calculate cumulative annual revenue/income, which is continuously evaluated against the relief threshold. |
| **Monthly Operating Costs** | Numeric value (PLN) | Deducted from revenue (in Tax Scale and Flat Tax only) to calculate the actual taxable income base that consumes the relief limit. |
| **ZUS (Social Security) Status** | `Full`, `Preferential`, `Relief to Start`, `None` | Deducted from the revenue/income base before applying the return relief, slowing down the rate at which the 85,528 PLN limit is consumed. |

## 3. Core Functional Logic
The processing engine for the Return Relief operates as a cumulative, month-by-month state machine that evaluates the taxpayer's accumulated income against the statutory cap.

* **Step 1: Base Income Calculation**
    * For **Tax Scale / Flat Tax**: The system calculates the monthly taxable income base (`Revenue` - `Deductible Costs` - `Social Security Contributions`).
    * For **Lump Sum**: The system calculates the revenue base (`Revenue` - `Social Security Contributions`), as costs are not deductible.
* **Step 2: Cumulative Tracking & Threshold Evaluation**
    * The engine maintains a running total of the base calculated in Step 1 across the calendar year (January to December).
    * If the cumulative base is `≤ 85,528 PLN`, the effective Personal Income Tax (PIT) for that month is hardcoded to `0.00 PLN`.
* **Step 3: Threshold Breach (Pro-rata Calculation)**
    * In the specific month where the cumulative income crosses the 85,528 PLN limit, the system splits the income.
    * The portion of income up to 85,528 PLN is taxed at 0%.
    * The excess portion (above 85,528 PLN) becomes subject to standard taxation rules.
* **Step 4: Interaction with Standard Tax-Free Allowance (Tax Scale Only)**
    * If the user has selected "Tax Scale" (Zasady ogólne), the system applies an *additional* 30,000 PLN tax-free allowance immediately after the 85,528 PLN return relief is exhausted.
    * Functionally, this means a Tax Scale user will pay 0 PLN in income tax until their cumulative taxable income reaches 115,528 PLN.
* **Step 5: Health Insurance Contribution (Składka Zdrowotna) Isolation**
    * The logic explicitly isolates Health Insurance calculations from this relief. The return relief *only* exempts the user from PIT, not health contributions. Health contributions continue to be calculated on the full, unreduced income/revenue base as per the rules of the selected taxation form.

## 4. Output & Reporting Metrics

| Output Metric | Description |
| :--- | :--- |
| **Monthly Income Tax (PIT)** | Displays `0.00 PLN` for the initial months, shifting to standard calculated tax amounts only in the month the threshold is exceeded. |
| **Year-to-Date (YTD) Income Tax** | The cumulative sum of PIT paid. Will remain artificially low compared to a scenario where the relief toggle is set to `No`. |
| **Net Income (Netto)** | The final take-home pay, which will show a significant monthly increase during the tax-free period due to the absence of the PIT deduction. |
| **Effective Tax Rate** | A calculated percentage (`Total Annual PIT` / `Total Annual Net Revenue`), demonstrating the blended, lowered tax burden resulting from the relief. |

## 5. Business Rules & Constraints
* **Absolute Threshold Limit:** The statutory cap is strictly hardcoded to `85,528 PLN` per tax year. The system must not apply the relief to any single grosz above this amount.
* **Exclusion of Health Contributions:** The system MUST NOT reduce the base for the Health Insurance contribution (Składka zdrowotna). Even if PIT is 0 PLN due to the relief, the 9% (Tax Scale), 4.9% (Flat Tax), or tiered fixed amounts (Lump Sum) must still be levied on the standard basis.
* **Mutual Exclusivity Restrictions:** Under Polish law, the Return Relief (Ulga na powrót) shares the 85,528 PLN limit with other demographic reliefs (e.g., Youth Relief/PIT-0 dla Młodych, Senior Relief, 4+ Family Relief). If the calculator expands to include these, the system must enforce a shared, cumulative constraint where the sum of all applied reliefs cannot exceed 85,528 PLN annually.
* **Calendar Year Constraint:** The relief logic automatically resets on January 1st of the projected year. The calculator models a single calendar year flow and assumes the user is within their eligible 4-year statutory window.
* **Non-Refundable Nature:** If the user's total annual income is less than 85,528 PLN, the unused portion of the relief is discarded. It does not generate a tax credit or carry over to the next calculator year.
