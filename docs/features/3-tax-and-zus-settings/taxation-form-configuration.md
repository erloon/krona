# Functional Specification: Taxation Form Configuration

## 1. Executive Summary
The Taxation Form Configuration feature is the core computational engine of the B2B calculator. It allows users operating as sole proprietorships (Jednoosobowa Działalność Gospodarcza - JDG) in Poland to select and compare the three primary statutory tax regimes: Progressive Tax (Skala podatkowa), Linear Tax (Podatek liniowy 19%), and Lump Sum (Ryczałt). Its primary business value lies in accurately forecasting net monthly and annual income by calculating Income Tax (PIT) and the mandatory Health Contribution (Składka zdrowotna), which dynamically shift based on the chosen taxation form, reported revenue, eligible costs, and supplementary tax reliefs (e.g., IP Box, Joint Settlement).

## 2. Input & Configuration Parameters
| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **Form of Taxation** (Forma opodatkowania) | `Skala podatkowa`, `Podatek liniowy 19%`, `Ryczałt` | Determines the overarching calculation algorithm for Income Tax (PIT) brackets/rates and the Health Contribution rules. Dictates whether business costs are deductible. |
| **Lump Sum Rate** (Stawka ryczałtu) | `17%`, `15%`, `14%`, `12%`, `8.5%`, `5.5%`, `3%`, `2%` | *Condition: Appears only if "Ryczałt" is selected.* Determines the flat percentage applied directly to gross revenue. |
| **Joint Settlement** (Rozliczenie z małżonkiem) | `Boolean (True/False)` | *Condition: Only applies to "Skala podatkowa".* Combines tax free allowances (2 x 30,000 PLN) and doubles the first tax bracket threshold (2 x 120,000 PLN = 240,000 PLN). |
| **IP BOX** | `Boolean (True/False)` | Overrides standard income tax with a preferential 5% rate on qualified intellectual property income. Typically applied to B2B software engineers. |
| **Relief for Return** (Ulga na powrót) | `Boolean (True/False)` | Applies an income tax exemption up to a statutory limit of 85,528 PLN per year for eligible taxpayers returning to Poland. |
| **PIT-0 for Families** | `Boolean (True/False)` | Applies an income tax exemption up to 85,528 PLN for parents with 4+ children. |

## 3. Core Functional Logic
The processing engine dynamically reacts to the Form of Taxation input, orchestrating the calculation of both Income Tax and Health Contributions.

* **Workflow 1: Progressive Tax (Skala podatkowa) Engine**
    * **Tax Base Calculation:** Revenue minus Business Costs minus Social Security (ZUS) contributions.
    * **Algorithm:** * Applies a 30,000 PLN annual tax-free allowance.
        * Income up to 120,000 PLN is taxed at 12%.
        * Income exceeding 120,000 PLN is taxed at 32%.
    * **Health Contribution:** Calculated as 9% of the monthly income. Cannot fall below the statutory minimum (9% of the national minimum wage).
    * **Modifier Action:** If "Joint Settlement" is active, the engine doubles the first bracket threshold to 240,000 PLN and doubles the tax-free allowance.

* **Workflow 2: Linear Tax (Podatek liniowy 19%) Engine**
    * **Tax Base Calculation:** Revenue minus Business Costs minus Social Security (ZUS) contributions. Note: A capped amount of the Health Contribution can also be deducted from the tax base or costs.
    * **Algorithm:** Applies a flat 19% tax rate to the total tax base, regardless of the income amount. No tax-free allowance is applied.
    * **Health Contribution:** Calculated as 4.9% of the monthly income. Cannot fall below the statutory minimum.
    * **Solidary Tax Trigger:** If the tax base exceeds 1,000,000 PLN, an additional 4% "Danina Solidarnościowa" is calculated on the surplus.

* **Workflow 3: Lump Sum (Ryczałt) Engine**
    * **Tax Base Calculation:** Total Revenue minus Social Security (ZUS) contributions. Business costs are explicitly ignored (zeroed out in the equation).
    * **Algorithm:** Applies the user-selected flat rate (e.g., 12% for IT) directly to the tax base.
    * **Health Contribution:** Tiered calculation based on cumulative annual revenue thresholds:
        * Tier 1 (Up to 60,000 PLN): Flat monthly fee based on 60% of the average national wage.
        * Tier 2 (60,000 PLN - 300,000 PLN): Flat monthly fee based on 100% of the average national wage.
        * Tier 3 (Over 300,000 PLN): Flat monthly fee based on 180% of the average national wage.
    * Note: A portion (50%) of paid health contributions can be deducted from the revenue tax base.

## 4. Output & Reporting Metrics
| Output Metric | Description |
| :--- | :--- |
| **Total Income Tax (PIT)** | The calculated monthly and annualized income tax amount, reflecting applicable brackets, flat rates, and configured tax reliefs. |
| **Health Contribution (Zdrowotna)** | The calculated mandatory health insurance fee, specific to the rules of the selected taxation form (9%, 4.9%, or tiered flat rate). |
| **Effective Tax Rate** | A computed percentage representing the total tax burden (PIT + ZUS + Health) against the gross revenue. |
| **Net Income (Przychód netto)** | The final "take-home" amount (Revenue - Costs - ZUS - Health Contribution - Income Tax). |

## 5. Business Rules & Constraints
* **Cost Exclusion (Ryczałt):** If "Ryczałt" is selected, the application must immediately disable or ignore any inputted business costs (Koszty) for tax calculations. Costs still exist in cash-flow (Net Income) but do not lower the tax base.
* **Joint Settlement Mutually Exclusive Constraint:** Joint Settlement (Rozliczenie z małżonkiem) is strictly prohibited by Polish law for Linear Tax and Lump Sum. Selecting these forms must disable the Joint Settlement toggle.
* **Statutory Minimum Health Contribution:** For Linear and Progressive regimes, if the calculated monthly income (or loss) yields a health contribution lower than 9% of the current statutory minimum wage, the system must forcefully floor the value to this minimum threshold.
* **Relief Cap Validation:** Both "Ulga na powrót" and "PIT-0 for Families" must halt the tax exemption effect strictly at the 85,528 PLN limit per tax year. Income earned beyond this threshold must be routed back to the standard taxation algorithm.
* **Solidary Tax Rule:** The system must actively monitor the 1,000,000 PLN annual income threshold for Skala and Liniowy. Any PLN over this limit triggers an automatic 4% surcharge deduction.
