# Functional Specification: Voluntary Sickness Insurance

## 1. Executive Summary
The "Voluntary Sickness Insurance" (Dobrowolne ubezpieczenie chorobowe) feature within the B2B calculator allows sole proprietors (B2B contractors) to determine the financial impact of opting into the Polish statutory sickness fund. Since sickness insurance is optional for B2B entities in Poland, this module accurately calculates the additional ZUS (Social Insurance Institution) premium based on the selected ZUS scheme, dynamically updates total business costs, and adjusts the tax base and final net income accordingly.

## 2. Input & Configuration Parameters
| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| Voluntary Sickness Insurance (Dobrowolne ubezpieczenie chorobowe) | `Yes` (Checked) / `No` (Unchecked) | Triggers the calculation of the sickness insurance premium. If `Yes`, it increases the total social security contributions (ZUS społeczne) and decreases the income tax base. |

## 3. Core Functional Logic
* **Dependency on ZUS Scheme:** The calculator first evaluates the currently selected ZUS contribution scheme (e.g., Standard ZUS, Preferential ZUS / Mały ZUS).
* **Base Assessment:** It determines the statutory contribution base (Podstawa wymiaru składek) tied to the selected ZUS scheme:
    * *Standard ZUS:* Typically 60% of the projected average monthly wage.
    * *Preferential ZUS:* 30% of the national minimum wage.
* **Premium Calculation:** The system calculates exactly 2.45% of the determined contribution base.
* **Aggregation:** The calculated sickness premium is added to the mandatory social insurance premiums (Retirement, Disability, Accident / Emerytalne, Rentowe, Wypadkowe) to form the total "Social ZUS" (ZUS społeczne) payload.
* **Tax Base Adjustment:** The total Social ZUS value (which now includes the sickness premium) is deducted from the gross revenue (for lump-sum/ryczałt) or income (for tax scale/linear tax) to establish the revised tax base.
* **Net Income Recalculation:** The final net income (na rękę) is recalculated based on the slightly reduced tax burden but increased total ZUS deduction.

## 4. Output & Reporting Metrics
| Output Metric | Description |
| :--- | :--- |
| Sickness Insurance Premium (Składka chorobowa) | The exact calculated monetary value of the sickness contribution (displayed as a line item in the ZUS breakdown). |
| Total Social Security Contributions (Suma ZUS) | The aggregated cost of ZUS contributions, reflecting the inclusion of the sickness premium. |
| Adjusted Tax Base (Podstawa opodatkowania) | The recalculated base amount upon which income tax is levied, lowered due to the higher deductible ZUS cost. |
| Net Income (Na rękę) | The final take-home pay, typically reduced slightly due to the premium cost outweighing the tax deduction benefit. |

## 5. Business Rules & Constraints
* **Ulga na Start (Relief to Start) Exclusion:** If the user selects "Ulga na start", the Voluntary Sickness Insurance option must be disabled, hidden, or ignored in calculations, because social security contributions (and therefore sickness insurance) are not applicable during this 6-month period.
* **Statutory Rate Fixation:** The calculation multiplier is strictly bound by Polish law to 2.45% of the applicable ZUS base. The user cannot manually override this rate.
* **Non-Deductibility for Health Insurance:** The sickness insurance premium does not affect the base calculation for the Health Insurance (Składka zdrowotna) premium under the Polish Deal (Polski Ład) rules; Health Insurance is calculated on income/revenue independently of social ZUS.
* **Proportionality Rule:** (Edge case limitation) The calculator assumes a full month of contributions. It does not natively support partial-month prorated sickness calculations (e.g., if a business is suspended mid-month), operating purely on standard monthly statutory thresholds.
