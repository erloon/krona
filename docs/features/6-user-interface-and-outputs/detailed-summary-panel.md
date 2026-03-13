# Functional Specification: Detailed Summary Panel

## 1. Executive Summary
The Detailed Summary Panel is the primary reporting interface of the B2B calculator, designed to provide independent contractors and business owners with a transparent, granular breakdown of their financial obligations and net earnings. Its core business value lies in translating complex Polish tax regulations (including "Polski Ład" rules) into an easy-to-understand monthly and annual financial projection. By instantly reflecting changes in tax forms, ZUS (Social Security) preferences, and revenue levels, this feature empowers users to make data-driven decisions regarding their optimal B2B contract structure and business model setup.

## 2. Input & Configuration Parameters
The Detailed Summary Panel listens to the state of the calculator's primary inputs. Here are the parameters that directly drive the panel's rendering and logic:

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **Taxation Form** (Forma opodatkowania) | Tax Scale (12%/32%), Flat Tax (19%), Lump Sum / Ryczałt (2% - 17%) | Dictates the core algorithms used to calculate income tax, tax-free allowances, and the statutory health contribution (Składka zdrowotna) rules. |
| **ZUS Contribution Level** (Składki ZUS) | Start Relief (Ulga na start), Reduced ZUS (Preferencyjny), Standard ZUS (Duży ZUS) | Determines the base calculation for social security deductions. Affects both the deductible expenses and the final net profit. |
| **Sickness Insurance** (Ubezpieczenie chorobowe) | Yes (Opt-in), No (Opt-out) | Adds an additional ~2.45% (based on the ZUS base) deduction to the social security total. |
| **Monthly Net Revenue** (Przychód netto) | Numeric value (PLN) | Serves as the primary gross inflow before any deductions, taxes, or VAT are applied. |
| **Monthly Operating Expenses** (Koszty netto) | Numeric value (PLN) | Reduces the tax base for Tax Scale and Flat Tax. Does not affect the tax base for Lump Sum (Ryczałt). |
| **Tax Year** (Rok podatkowy) | Current Year, Previous Year | Applies the specific statutory limits, minimum wages, and ZUS bases legally binding for the selected calendar year. |

## 3. Core Functional Logic
The processing engine for the Detailed Summary Panel executes a sequential waterfall algorithm to derive net income. It interacts continuously with the global application state, triggering recalculations whenever an input changes.

* **Step 1: Gross-to-Net Revenue Processing**
    * Calculates the VAT amount (if the user is flagged as a VAT payer) to establish the total invoice value (Gross).
    * Isolates the Net Revenue for tax and contribution processing.
* **Step 2: Social Security (ZUS) Deduction Workflow**
    * Queries the statutory ZUS base for the selected year and ZUS level (e.g., 60% of projected average wage for Standard ZUS).
    * Calculates mandatory components (Pension, Disability, Accident) and optional components (Sickness) based on statutory percentages.
    * Deducts the ZUS sum from the revenue to establish the initial tax base (excluding Lump Sum, where it deductions from revenue, not income).
* **Step 3: Health Contribution (Składka Zdrowotna) Engine**
    * *Tax Scale:* Applies a strict 9% rate to the income (Revenue - Expenses - ZUS).
    * *Flat Tax:* Applies a 4.9% rate to the income, respecting the statutory minimum health contribution and partial tax deductibility limits.
    * *Lump Sum:* Applies fixed monetary amounts based on annual revenue thresholds (<60k PLN, 60k-300k PLN, >300k PLN).
* **Step 4: Income Tax Calculation**
    * Reduces the tax base by applicable tax-free allowances (e.g., 30,000 PLN for Tax Scale).
    * Applies the tax rate based on the chosen Taxation Form.
    * Checks for and triggers threshold crossings (e.g., exceeding 120,000 PLN under the Tax Scale shifts the marginal rate from 12% to 32%).
* **Step 5: Net Profit Aggregation**
    * `Net Profit = Net Revenue - Operating Expenses - ZUS Contributions - Health Contribution - Income Tax`
    * Aggregates the monthly data to project an annual summary, factoring in progressive changes over the 12-month period.

## 4. Output & Reporting Metrics
The panel renders the following calculated outputs to the user:

| Output Metric | Description |
| :--- | :--- |
| **Total Invoice Value (Brutto)** | The total cash amount the contractor bills the client, including VAT (if applicable). |
| **Net Invoice Value (Netto)** | The baseline revenue excluding VAT, used as the starting point for tax calculations. |
| **Social Security (ZUS Społeczne)** | The aggregate total of pension, disability, accident, and (if selected) sickness insurance contributions. |
| **Health Contribution (ZUS Zdrowotny)** | The mandatory health insurance cost, distinctly separated from standard ZUS due to Polish tax laws. |
| **Income Tax (Zaliczka na podatek)** | The calculated monthly advance tax payment owed to the Tax Office (Urząd Skarbowy). |
| **Take-Home Pay (Na rękę)** | The final usable net profit remaining after all operating expenses, ZUS, health contributions, and taxes have been paid. |
| **Effective Tax Rate** | A percentage indicating the total burden of taxes and contributions relative to the initial net revenue. |

## 5. Business Rules & Constraints
The functionality is strictly bound by Polish statutory laws. The following constraints and edge cases govern the engine:

* **Minimum Health Contribution Limit:** Even if a business generates a loss or extremely low income, the health contribution engine must enforce the statutory minimum (calculated as 9% of the statutory minimum wage for the given year).
* **Flat Tax Health Contribution Deductibility Cap:** For Flat Tax (19%), the system must enforce a hard legal cap on how much of the health contribution can be deducted from the tax base or tax itself (limit updated annually, e.g., 11,600 PLN in 2024).
* **Tax Threshold Crossover Rule:** For the Tax Scale, the engine must dynamically shift the tax calculation from 12% to 32% in the exact month the accumulated annual income exceeds 120,000 PLN.
* **Lump Sum (Ryczałt) Expense Constraint:** If the user selects Lump Sum, the "Operating Expenses" input must be disabled or its value completely ignored in the calculation engine, as Lump Sum taxes revenue, not income.
* **Ulga na start (Start Relief) Time Limit:** Though not strictly enforced via a calendar in basic B2B calculators, the business logic assumes 0 PLN for ZUS Społeczne (only Health Contribution applies) when this option is selected.
* **Zero-Negative Income Handling:** The system must prevent negative income tax outputs. If allowable deductions exceed revenue, the tax advance for that month must floor at 0 PLN, carrying over the loss where applicable under standard accounting logic.
