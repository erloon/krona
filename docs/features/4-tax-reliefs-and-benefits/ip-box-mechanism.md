# Functional Specification: IP Box Mechanism

## 1. Executive Summary
The IP Box (Innovation Box) mechanism is a specialized tax preference module within the B2B calculator designed for Polish entrepreneurs engaged in Research and Development (R&D) activities. Its core purpose is to calculate the potential tax savings resulting from the application of a preferential 5% Corporate Income Tax (CIT) or Personal Income Tax (PIT) rate on qualified income derived from intellectual property rights. The business value lies in enabling IT professionals, engineers, and innovators to estimate their net income after applying this specific tax relief, factoring in the complex calculation of the nexus ratio and qualified costs.

## 2. Input & Configuration Parameters
The following inputs are required to activate and calculate the IP Box preference within the B2B context:

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **IP Box Eligibility** | Toggle (On/Off) | Activates the calculation logic for the 5% tax rate; hides/shows related sub-parameters. |
| **Qualified Income %** | Numeric (0 - 100%) | Defines the portion of the total invoice amount that qualifies as income from eligible IP rights (e.g., software code). |
| **Qualified Costs (Category A)** | Currency Amount (PLN) | Costs incurred for R&D activities conducted directly by the taxpayer (used for Nexus ratio). |
| **Qualified Costs (Category B)** | Currency Amount (PLN) | Costs for acquiring R&D results from unrelated entities (used for Nexus ratio). |
| **Qualified Costs (Category C)** | Currency Amount (PLN) | Costs for acquiring R&D results from related entities (used for Nexus ratio). |
| **Qualified Costs (Category D)** | Currency Amount (PLN) | Costs for acquiring qualified IP rights (used for Nexus ratio). |



## 3. Core Functional Logic
The IP Box mechanism operates as a secondary tax overlay on top of the standard B2B taxation models (Tax Scale or Flat Tax). The processing engine follows this logical flow:

* **Income Partitioning:** The system splits the total Revenue into "Qualified IP Income" and "Standard Income" based on the user-provided percentage.
* **Nexus Ratio Calculation:** The system calculates the efficiency coefficient (Nexus) using the formula:
    * `Nexus = (a + b) * 1.1 / (a + b + c + d)`
    * Where *a, b, c, d* correspond to the Qualified Costs categories.
    * *Constraint:* The Nexus ratio cannot exceed 1.0.
* **Tax Base Determination:** * The Qualified IP Income is multiplied by the Nexus ratio to determine the portion of income eligible for the 5% rate.
    * The remaining income is taxed at the base rate (12%/32% for Tax Scale or 19% for Flat Tax).
* **Social Security (ZUS) Interaction:** The system subtracts ZUS contributions proportionally or entirely from the standard income base first, as IP Box specifically targets the income tax rate, not the social insurance base.
* **Health Insurance Calculation:** For Flat Tax users, health insurance remains calculated based on the total income (including IP Box income), as the 5% rate does not reduce the health insurance base.

## 4. Output & Reporting Metrics
The system provides a comparative view to show the financial benefit of the mechanism:

| Output Metric | Description |
| :--- | :--- |
| **Tax Payable (5%)** | The total amount of income tax due specifically on the qualified IP portion. |
| **Effective Tax Rate** | The weighted average tax rate across all income (Standard + IP Box). |
| **IP Box Tax Gain** | The difference between tax paid on standard terms vs. the 5% IP Box preferential terms. |
| **Calculated Nexus Ratio** | The coefficient (up to 1.00) determining how much of the IP income can benefit from the relief. |
| **Net Income (IP Box)** | Total take-home pay after ZUS, Health Insurance, and the split-rate income tax. |

## 5. Business Rules & Constraints
* **Statutory Rate:** The IP Box rate is fixed at 5% according to the Polish PIT/CIT Act.
* **Nexus Cap:** The system must cap the Nexus ratio at 1.00, even if the formula results in a higher value.
* **Tax Form Compatibility:** The IP Box mechanism is only applicable to the "Flat Tax" (Podatek Liniowy) and "Tax Scale" (Skala Podatkowa). It is functionally incompatible with the "Lump Sum" (Ryczałt) model in this calculator.
* **Expense Validation:** Category A and B costs are "promoted" by a 1.1 multiplier in the Nexus formula, reflecting the legislative incentive for internal R&D.
* **Year-end Reconciliation:** The calculator assumes a monthly estimation, but business rules notify the user that IP Box is technically settled in the annual tax return (PIT-36/PIT-36L with attachment PIT/IP).
* **Minimum Thresholds:** No minimum income threshold is required, but the system assumes the user maintains a separate accounting record (required by Polish law) to distinguish IP income.
