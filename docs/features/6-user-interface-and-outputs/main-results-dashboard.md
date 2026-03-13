# Functional Specification: Main Results Dashboard

## 1. Executive Summary
The Main Results Dashboard is the central output component of the B2B calculator application. Its primary goal is to provide a real-time, comprehensive breakdown of a Polish B2B contractor's net disposable income ("na rękę"). By aggregating user-defined revenues and costs, and subsequently applying current statutory Polish tax logic (Polski Ład), the dashboard computes all mandatory deductions—specifically VAT, Income Tax (PIT), Social Security (ZUS), and Health Contributions (Składka Zdrowotna). This feature enables users to instantly evaluate the financial viability of a B2B contract and visually compare it against a standard Employment Contract (UoP).

## 2. Input & Configuration Parameters
The dashboard is driven dynamically by a state engine fed by the following user inputs:

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **Revenue Parameters** | Amount, Currency (PLN, USD, EUR, GBP, CHF), Billing frequency (Monthly, Daily, Hourly), Days/month, Hours/day | Dictates the gross revenue baseline. The engine automatically annualizes and converts foreign currencies to PLN based on fixed exchange rates for downstream tax calculations. |
| **VAT Rate** | 0% (bez VAT), 5%, 8%, 23% | Determines the output VAT added to invoices. (VAT is tracked separately and does not increase net income). |
| **Form of Taxation** | Skala podatkowa (Tax Scale), Podatek liniowy 19% (Flat Tax), Ryczałt (Lump Sum) | A critical variable that entirely alters the algorithm used for calculating PIT and Health Contributions. |
| **ZUS Contribution Level** | Brak ulgi (Standard), Składka preferencyjna (Reduced), Ulga na start (Starter Relief), Umowa o pracę (ZUS paid via UoP) | Defines the base used to calculate social security deductions (Emerytalne, Rentowe, Wypadkowe, Fundusz Pracy). |
| **Voluntary Sick Leave** | Boolean (Dobrowolne ubezpieczenie chorobowe) | If active, adds the chorobowe percentage (usually 2.45% of the ZUS base) to the total ZUS deduction. |
| **Time Off / Vacations** | Number of unpaid vacation days (Odłóż na urlop) | Reduces the annualized working days/hours, thereby lowering the projected gross annual revenue and altering monthly averages. |
| **Tax Reliefs & IP Box** | IP BOX (Boolean/Rate), Ulga na powrót (Relief for returnees), Rozliczenie ze współmałżonkiem (Joint taxation) | Triggers statutory tax exemptions (e.g., zero PIT up to 85,528 PLN for returnees) or applies a preferential 5% PIT rate (IP Box). |
| **Business Costs** | Array of cost items with Amount and VAT deductibility | Reduces the taxable base for PIT (in Skala/Liniowy) and reduces the base for Health Contributions. |

## 3. Core Functional Logic
The Main Results Dashboard operates on a real-time, reactive calculation engine. When any input is modified, the dashboard executes the following processing workflow:

* **Step 1: Gross Revenue Aggregation & Normalization**
    * Normalizes hourly and daily rates into a monthly and annual Gross PLN value using the configured working days/hours and currency exchange rates.
* **Step 2: ZUS (Social Security) Calculation**
    * Determines the statutory ZUS base depending on the selected relief (Ulga na start = 0 PLN for social, Preferencyjna = 30% of minimum wage, Brak ulgi = 60% of projected average wage).
    * Applies the sick leave (chorobowe) deduction if toggled. 
* **Step 3: Taxable Base Computation**
    * For *Skala* and *Liniowy*: Taxable Base = (Gross Revenue - Net Costs - ZUS Social Contributions).
    * For *Ryczałt*: Calculates applicable revenue tiers without deducting standard business costs (except ZUS).
* **Step 4: Health Contribution (Składka Zdrowotna) Calculation**
    * Applies Polski Ład rules: 
        * *Skala*: 9% of income.
        * *Liniowy*: 4.9% of income (subject to a minimum statutory threshold).
        * *Ryczałt*: Calculates based on three annual revenue tiers (up to 60k PLN, 60k-300k PLN, over 300k PLN) multiplied by the statutory average wage base.
* **Step 5: Income Tax (PIT) Calculation**
    * Applies the selected tax logic to the taxable base (minus deductible health contributions for Liniowy/Ryczałt, if applicable).
    * Monitors thresholds (e.g., applying 32% tax rate once income exceeds 120,000 PLN in *Skala*).
* **Step 6: Net Income Generation**
    * Calculates Final Net = Gross Revenue - ZUS - Health Contribution - PIT - (VAT adjustments if costs don't perfectly offset).
* **Step 7: View Rendering**
    * Updates the high-level dashboard cards and recalculates the detailed expandable table (Szczegółowe podsumowanie) showing month-by-month or aggregate breakdowns.

## 4. Output & Reporting Metrics
The dashboard generates and renders the following metrics back to the UI:

| Output Metric | Description |
| :--- | :--- |
| **Przychód netto miesięcznie (Net Monthly Income)** | The headline metric. The final "take-home" cash amount (na rękę) after all statutory deductions and business costs are subtracted. |
| **PIT Deduction** | The calculated monthly (or averaged annual) income tax liability owed to the Urząd Skarbowy. |
| **VAT Obligation** | The net VAT amount (Output VAT from sales minus Input VAT from costs) to be paid to the tax authority. |
| **ZUS Deduction** | The sum of mandatory social security contributions (pension, disability, accident, labor fund) based on the user's ZUS status. |
| **Zdrowotna (Health Contribution)** | The calculated mandatory health care contribution, split out from standard ZUS due to Polski Ład regulations. |
| **Detailed Breakdown (Szczegółowe podsumowanie)** | An expandable matrix detailing gross income, specific deductions, and net income, often required to visualize non-linear taxes (e.g., crossing the 120k PLN threshold in November). |

## 5. Business Rules & Constraints
The engine relies on strict statutory thresholds and systemic validation rules:

* **Tax Threshold Constraints (Skala Podatkowa)**: The system must enforce a 12% tax rate up to 120,000 PLN of annual income, and shift dynamically to 32% for every PLN earned above this threshold. A tax-free allowance (Kwota wolna od podatku) of 30,000 PLN must be applied.
* **Health Contribution Minimums**: Under *Podatek liniowy*, the health contribution is 4.9%, but it cannot be lower than 9% of the statutory minimum wage for a given month.
* **Health Contribution Deductibility**: The system must cap the deductibility of the health contribution from the tax base based on annual statutory limits (e.g., specific caps for Liniowy and Ryczałt updated annually).
* **ZUS Relief Time Limits**: *Ulga na start* is strictly validated as a 6-month period, and *Składka preferencyjna* is capped at 24 months. (While the calculator might assume a static monthly snapshot, annual projections must account for these expirations if an annual view is triggered).
* **Ryczałt Cost Constraint**: If the user selects *Ryczałt*, the system must disable or ignore operational cost inputs (koszty prowadzenia działalności) for PIT calculations, as flat-rate tax does not allow cost deductions.
* **Ulga na powrót (Return Relief) Limit**: Income is fully exempt from PIT up to the strict limit of 85,528 PLN per year. The engine must track cumulative annual revenue and resume standard taxation once this limit is breached.
