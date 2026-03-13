# Functional Specification: Multi-Source Revenue Management (MSRM)

## 1. Executive Summary
The MSRM engine is a financial logic layer designed to calculate the profitability of B2B contracts. It transforms a Gross Invoice Amount into a Net "To-Hand" Profit by applying complex, interdependent tax and social security algorithms specific to the Polish economic system.

---

## 2. Revenue Stream Configuration

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **Taxation Form** | Tax Scale (Skala), Flat Tax (Liniowy), Lump Sum (Ryczałt) | Determines the algorithm for PIT calculation and health insurance base. |
| **Gross Revenue** | Numeric Input (PLN) | The base amount for all subsequent calculations (Monthly or Hourly). |
| **Lump Sum Rate** | 2%, 3%, 5.5%, 8.5%, 12%, 14%, 15%, 17% | Active only for "Ryczałt"; defines the tax percentage on revenue. |
| **IP Box** | Toggle (On/Off) | Applies a preferential 5% tax rate to qualified intellectual property income. |
| **Joint Settlement** | None, With Spouse, As Single Parent | Available for Tax Scale; doubles the tax-free bracket and 32% threshold. |

---

## 3. Business Expense & VAT Module

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **Operating Costs** | Numeric Input (PLN Net) | Deducts from tax base in Scale/Flat Tax. Reduces final profit only in Lump Sum. |
| **VAT Status** | Exempt (Zwolniony), Active (23%, 8%, 5%) | Calculates Gross Invoice value and potential VAT refunds from business costs. |
| **Company Car** | None, Private & Business, Business Only | Defines VAT deduction limits (50% vs 100%) and subsequent tax-deductible cost proportions. |

---

## 4. Social Security (ZUS) Configuration

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **ZUS Scheme** | Standard, Start-up Relief, Small ZUS, No ZUS | Determines the base calculation for mandatory social contributions. |
| **Sickness Insurance** | Toggle (On/Off) | Voluntary addition; increases total ZUS cost but provides paid sick leave eligibility. |
| **Labor Fund (FP)** | Auto-calculated | Added to Standard ZUS unless specific age or status exemptions apply. |

---

## 5. Health Insurance (Składka Zdrowotna) Logic
The system applies distinct functional rules based on the selected Taxation Form:

* **Tax Scale:** Calculated as 9% of actual income (non-deductible).
* **Flat Tax:** Calculated as 4.9% of income (applies a minimum floor based on minimum wage; allows partial tax deduction up to an annual limit).
* **Lump Sum:** Fixed monthly rate based on Annual Revenue tiers (Under 60k PLN, 60k - 300k PLN, Over 300k PLN).

---

## 6. Output & Reporting Metrics

| Output Metric | Description |
| :--- | :--- |
| **Net Income (To-Hand)** | Final liquid amount after all taxes, ZUS, and business costs are deducted. |
| **Total Tax Liability** | The sum of Personal Income Tax (PIT) owed to the tax office. |
| **Total ZUS Cost** | Cumulative cost of all mandatory social and health contributions. |
| **Effective Tax Rate** | Percentage of gross revenue strictly lost to public levies. |

---

## 7. Business Rules & Constraints
* **The 32% Threshold:** The engine tracks cumulative annual income for the Tax Scale. Exceeding 120,000 PLN triggers an automatic switch from the 12% to the 32% tax bracket for the surplus.
* **Minimum Wage Protection:** Health insurance in Flat Tax and Tax Scale models cannot drop below a statutory minimum floor.
* **Real-time Reactivity:** Any modification to a single parameter (e.g., adding 100 PLN to costs) triggers an immediate, full recalculation of all dependent fields.
* **Validation:** The system prevents negative income results by capping tax deductions at the generated revenue level.
