# Functional Specification: B2B vs UoP Comparison Toggle

## 1. Executive Summary
The "B2B vs UoP Comparison Toggle" is a critical decision-support feature within the calculator. Its primary purpose is to provide a side-by-side financial analysis between a Business-to-Business (B2B) self-employment contract and a standard Employment Contract (Umowa o Pracę - UoP). In the Polish legal and tax landscape, this functionality allows professionals to determine the "break-even" point between these two forms of cooperation, accounting for different taxation models (Scale, Flat Tax, Lump Sum), social security (ZUS) contributions, and employer-side costs. The business value lies in enabling users to optimize their net income and understand the total cost of employment versus a B2B invoice amount.

## 2. Input & Configuration Parameters
| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **Comparison Mode Toggle** | ON / OFF | Activates the UoP input fields and side-by-side visualization. |
| **UoP Gross Salary** | Numerical (PLN) | Sets the baseline monthly or annual gross salary for the UoP side of the comparison. |
| **B2B Net Invoice (Netto)** | Numerical (PLN) | Sets the revenue amount for the B2B side (to be compared against UoP costs). |
| **Taxation Model (B2B)** | Skala (12%/32%), Podatek Liniowy (19%), Ryczałt (Various %) | Determines the tax calculation logic for the B2B side. |
| **ZUS Status (B2B)** | Ulga na start, Mały ZUS, Duży ZUS | Defines the fixed cost deductions for the B2B side. |
| **Work in Author's Rights (UoP)** | Percentage (0% - 100%) | Applies 50% Tax Deductible Costs (KUP) to the UoP calculation for creative work. |



## 3. Core Functional Logic
The comparison engine operates by executing two parallel calculation pipelines and then converging the data for delta analysis:

* **UoP Calculation Pipeline:**
    * Calculates employee-side deductions: Social Security (Pension, Disability, Sickness) and Health Insurance (9%).
    * Applies the Tax-Free Allowance (Kwota wolna od podatku) and calculates Personal Income Tax (PIT) based on the 12%/32% progressive scale.
    * Calculates the "Total Employer Cost" (Super-Gross), including the employer-side ZUS contributions, PPK, and Labor Fund.
* **B2B Calculation Pipeline:**
    * Calculates revenue minus business expenses.
    * Deducts relevant ZUS contributions based on the selected preference (e.g., "Mały ZUS").
    * Calculates Health Insurance based on the specific rules of the chosen tax model (e.g., 9% of income for Scale, fixed rate for Ryczałt).
* **Comparison Logic:**
    * **Net-to-Net:** Compares the final "take-home" pay of UoP vs. B2B.
    * **Cost-to-Invoice:** Compares the Total Employer Cost (UoP) against the Net Invoice amount (B2B). This helps B2B contractors negotiate rates that are cost-neutral for the client.
    * **Tax Wedge Analysis:** Calculates the total public burden (taxes + insurance) for both models.

## 4. Output & Reporting Metrics
| Output Metric | Description |
| :--- | :--- |
| **Net Income (UoP)** | The amount the employee receives "on hand" after all taxes and ZUS. |
| **Net Income (B2B)** | The amount remaining for the contractor after taxes, ZUS, and business costs. |
| **Monthly/Annual Delta** | The numerical difference (profit or loss) between choosing B2B over UoP. |
| **Total Cost of Employment** | The "Super-Gross" amount representing the total budget the employer spends. |
| **Effective Tax Rate** | The percentage of the total gross/invoice amount that goes to the state for each model. |

## 5. Business Rules & Constraints
* **Tax Scale Transition:** If UoP or B2B (Scale) income exceeds 120,000 PLN annually, the system must automatically apply the 32% tax rate to the surplus.
* **Health Insurance Non-Deductibility:** Under current "Polski Ład" rules, health insurance cannot be deducted from the tax amount, and the system must calculate it differently for Ryczałt (based on average salary brackets) vs. Liniowy (deduction limit) vs. Skala (no deduction).
* **ZUS Thresholds:** The system must respect the annual cap on pension and disability contributions (30-times the projected average salary) for both UoP and B2B.
* **Copyright Costs (KUP):** The 50% KUP for UoP is capped at the annual limit (120,000 PLN). The calculator must cap the benefit once this threshold is hit.
* **Minimum Wage Validation:** The UoP side cannot be calculated with a Gross Salary lower than the current statutory Polish Minimum Wage.
