# Functional Specification: ZUS Status Configuration

## 1. Executive Summary
The ZUS Status Configuration module determines the exact social security (Ubezpieczenie społeczne) and health care (Składka zdrowotna) contribution burdens for Polish B2B contractors (sole proprietorships/JDG). By allowing users to configure their legal entitlement to statutory relief periods (e.g., Ulga na start, Składka preferencyjna) or indicate concurrent full-time employment, the system applies the correct calculation algorithms. The core business value is delivering precise, legally compliant net revenue projections by ensuring that mandatory state deductions are accurately calculated according to current Polish tax and social security laws.

## 2. Input & Configuration Parameters

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **ZUS - Ubezpieczenie społeczne** | `Brak ulgi`, `Składka preferencyjna`, `Ulga na start`, `Umowa o pracę` | Dictates the statutory base used to calculate retirement, disability, accident, and labor fund contributions. |
| **Dobrowolne ubezpieczenie chorobowe** | `Checked` (True), `Unchecked` (False) | Includes or excludes the voluntary sickness insurance (ubezpieczenie chorobowe) rate against the active ZUS calculation base. |
| **Forma opodatkowania** *(Interdependent field)* | `Skala podatkowa`, `Podatek liniowy 19%`, `Ryczałt` | Dictates the formula for calculating mandatory Health Insurance (składka zdrowotna), which relies on social security deductions to establish its calculation base. |

## 3. Core Functional Logic
* **ZUS Base Resolution**: 
    * If `Brak ulgi` (Standard ZUS) is selected, the calculation base is set to 60% of the projected average monthly wage for the current year.
    * If `Składka preferencyjna` is selected, the calculation base is set to 30% of the current minimum wage.
    * If `Ulga na start` or `Umowa o pracę` is selected, the social security contribution base is effectively set to 0 PLN (only health insurance is processed).
* **Contribution Processing Workflow**:
    1.  Determine the mathematical base depending on the ZUS status.
    2.  Apply fixed percentage rates for retirement (emerytalne), disability (rentowe), and accident (wypadkowe) insurances.
    3.  Check the `Dobrowolne ubezpieczenie chorobowe` boolean. If true (and legally permissible), apply the sickness insurance rate to the base.
    4.  Determine if Labor Fund and Solidarity Fund (FP and FS) apply (only standard for `Brak ulgi`). Add to the total if applicable.
    5.  Aggregate all amounts into a single `Suma ZUS (Społeczne)`.
* **Inter-Module Data Flow (Health & Tax Impact)**:
    * The total calculated `Suma ZUS` is passed to the Health Contribution engine.
    * Social security contributions are deducted from the gross taxable income (for Skala/Liniowy) or revenue (for Ryczałt, deducting 50% of paid social contributions) before computing the respective income taxes and the subsequent health contribution.

## 4. Output & Reporting Metrics

| Output Metric | Description |
| :--- | :--- |
| **ZUS** | The aggregate monthly social security deduction, encompassing retirement, disability, accident, sickness, and labor fund contributions. |
| **Zdrowotna** | The mandatory monthly health insurance contribution, calculated based on the tax form's logic and adjusted by the social security contributions paid. |
| **Przychód netto miesięcznie** | The bottom-line monthly earnings indicator, updated in real-time after subtracting the aggregate ZUS, Zdrowotna, PIT, and VAT from the gross revenue. |

## 5. Business Rules & Constraints
* **Sickness Insurance Constraint**: `Dobrowolne ubezpieczenie chorobowe` MUST automatically calculate to 0 PLN and theoretically be disabled/ignored if `Ulga na start` or `Umowa o pracę` is selected, as there is no social security base to calculate it against.
* **Mandatory Health Insurance (Składka Zdrowotna)**: Selecting `Umowa o pracę` or `Ulga na start` drops social security to zero, but the health insurance calculation MUST persist based on the B2B gross income and chosen tax form. Health insurance is never waived.
* **FP/FS Exemption Rule**: The Labor Fund (Fundusz Pracy) and Solidarity Fund (Fundusz Solidarnościowy) MUST NOT be added to the total ZUS cost if `Składka preferencyjna` or `Ulga na start` are active. They are strictly bound to the standard `Brak ulgi` base.
* **Dynamic Annual Updates**: All percentage rates and flat-rate amounts tied to the ZUS options are strictly constrained by governmental statutory updates (e.g., changes to minimum wage in January/July) and must dynamically fetch the exact parameters for the active fiscal year.
* **Ryczałt Health Tiers Exception**: If `Ryczałt` is chosen as the tax form, the ZUS status does not alter the health contribution rates directly; instead, health contribution must follow the strict statutory revenue thresholds (<60k, 60k-300k, >300k PLN).

