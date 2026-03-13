# Functional Specification: Tax and Deduction Engine (tax-and-deduction-engine.md)

## 1. Executive Summary
The Tax and Deduction Engine is the core computational heart of the B2B Calculator. Its primary purpose is to transform a "Net Invoice Amount" (Przychód) into a "Net Profit on Hand" (Dochód na rękę) by applying the complex logic of the Polish tax system. It automates the calculation of Social Security (ZUS) contributions, Health Insurance, and Income Tax based on various taxation forms (Scale, Flat Tax, Lump Sum). The business value lies in providing B2B contractors with an accurate projection of their real earnings, accounting for fluctuating variables like the "Small ZUS" relief, tax-free thresholds, and deductible business expenses.

## 2. Input & Configuration Parameters
| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **Taxation Model** | Tax Scale (12%/32%), Flat Tax (19%), Lump Sum (Ryczałt) | Determines the algorithm for calculating Personal Income Tax (PIT) and available deductions. |
| **ZUS Contribution Type** | Start-up Relief, Small ZUS (Preferential), Large ZUS (Standard), ZUS Plus | Sets the fixed base amounts for Social Security (Pension, Disability, Accident) and Sickness insurance. |
| **Revenue (Net Invoice)** | Numerical value (PLN) | The base figure used for all percentage-based calculations and tax threshold checks. |
| **Business Expenses** | Numerical value (PLN) | Reduces the Tax Base for Scale and Flat Tax models; ignored in the Lump Sum model. |
| **Lump Sum Rate** | 2%, 3%, 5.5%, 8.5%, 12%, 14%, 15%, 17% | Only active if "Lump Sum" is selected; determines the tax percentage applied to total revenue. |
| **Sickness Insurance** | Yes / No (Optional) | Determines if the voluntary sickness contribution (2.45%) is added to the ZUS bundle. |
| **Joint Settlement** | Single, With Spouse, Single Parent | Applies only to Tax Scale; adjusts the calculation of the tax-free threshold and tax brackets. |

## 3. Core Functional Logic
The engine operates on a sequential processing pipeline to ensure compliance with Polish statutory accounting:

* **Step 1: Gross-to-Tax-Base Calculation**
    * For **Tax Scale/Flat Tax**: Tax Base = (Revenue - Expenses - Social Security Contributions).
    * For **Lump Sum**: Tax Base = (Revenue - Social Security Contributions). Note: Expenses are not deductible.
* **Step 2: ZUS Contribution Processing**
    * The engine retrieves the current year's statutory bases (Prognozowane Przeciętne Wynagrodzenie).
    * It applies the selected relief (e.g., *Ulga na start* excludes Social Security for 6 months, only Health Insurance is paid).
    * Calculates Sickness Insurance only if the "Voluntary" flag is active.
* **Step 3: Health Insurance Calculation (Polski Ład 2.0 Logic)**
    * **Tax Scale**: 9% of actual income (Revenue - Expenses - Social Security).
    * **Flat Tax**: 4.9% of actual income (with a minimum floor based on the minimum wage).
    * **Lump Sum**: Tiered fixed rate based on annual revenue brackets (below 60k, 60k-300k, above 300k PLN).
* **Step 4: Income Tax Application**
    * **Tax Scale**: Applies 12% up to 120,000 PLN (minus the 3,600 PLN tax-reducing amount) and 32% on the surplus.
    * **Flat Tax**: Applies a flat 19% rate. It checks for the deduction limit of Health Insurance (up to a statutory cap).
    * **Lump Sum**: Applies the selected percentage rate directly to the Tax Base.
* **Step 5: Final Aggregation**
    * The engine subtracts Total ZUS, Total Health Insurance, and calculated Income Tax from the Revenue to produce the Net Profit.



## 4. Output & Reporting Metrics
| Output Metric | Description |
| :--- | :--- |
| **Total ZUS (Social)** | Sum of Pension, Disability, and Accident contributions. |
| **Health Insurance** | The non-deductible (or partially deductible) health contribution amount. |
| **Income Tax (PIT)** | The final tax liability to be paid to the Tax Office (US). |
| **Net Profit (Na rękę)** | The final disposable income after all mandatory deductions. |
| **Effective Tax Rate** | The percentage of total revenue lost to taxes and contributions. |
| **Total Cost of Business** | The sum of expenses, ZUS, and taxes combined. |

## 5. Business Rules & Constraints
* **Tax-Free Threshold**: For the Tax Scale, the engine must apply a constant "Kwota Wolna od Podatku" of 30,000 PLN (resulting in a 3,600 PLN reduction in annual tax).
* **Middle Class Relief**: Ensure the engine reflects the removal of this relief (deprecated in current Polish law).
* **Health Insurance Floor**: If the calculated health insurance for Flat Tax or Tax Scale is lower than 9% of the minimum wage, the engine must automatically round up to the minimum statutory floor.
* **Lump Sum Thresholds**: The engine must trigger a warning if annual revenue exceeds 2,000,000 EUR (the limit for Lump Sum eligibility).
* **Solidarity Levy (Danina Solidarnościowa)**: For Flat Tax and Scale, the engine must calculate an additional 4% tax on the portion of annual income exceeding 1,000,000 PLN.
* **ZUS Base Cap (30-fold rule)**: The engine must cease calculating Pension and Disability contributions once the taxpayer's annual income exceeds the statutory "30-fold" limit.
