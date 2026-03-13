
# Functional Specification: ZUS Status Configuration

## 1. Executive Summary
The ZUS Status Configuration module determines the correct monthly social security (Ubezpieczenia społeczne) and health insurance (Składka zdrowotna) obligations for Polish B2B contractors operating as sole proprietorships (JDG). The module allows the user to declare which statutory ZUS scenario applies to their business situation and then routes the calculator to the proper contribution base and deduction logic.

Its main purpose is to prevent materially incorrect net-income projections caused by using the wrong ZUS regime. This is especially important because the selected status affects not only social contributions themselves, but also downstream health contribution calculations and the taxable base used in other calculation modules.

This module is a **status-selection and base-resolution layer**. It does not independently prove legal eligibility unless the application has supporting historical inputs (for example business start date, prior business activity, or employment salary level). Where such supporting data is not available, the module must treat the selected option as a **user declaration** and clearly communicate the statutory assumptions behind it.

The module operates on a **single monthly ZUS status assumption** for the current simulation. If the calculator does not support month-by-month status transitions, it must not blend multiple statuses within the same simulated period.

## 2. Input & Configuration Parameters

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **ZUS - Ubezpieczenie społeczne** | `Brak ulgi`, `Składka preferencyjna`, `Ulga na start`, `Umowa o pracę` | Determines which social-insurance regime is applied for the simulation. The selected value resolves the contribution base for pension, disability, accident, voluntary sickness insurance, and potential FP/FS charges. The value is mutually exclusive and must immediately re-trigger all dependent calculations. |
| **Dobrowolne ubezpieczenie chorobowe** | `Checked` (True), `Unchecked` (False) | Includes or excludes voluntary sickness insurance, but only when the active ZUS regime legally allows social insurance contributions from business activity. If the resolved social base is 0 PLN, this flag must be auto-ignored and the resulting value must be 0 PLN. |
| **Forma opodatkowania** *(Interdependent field)* | `Skala podatkowa`, `Podatek liniowy 19%`, `Ryczałt` | Determines the health contribution algorithm and the way paid social contributions influence tax calculations. This field does not change the social ZUS status itself, but it changes how the resulting ZUS amounts propagate into health and PIT logic. |

## 3. Core Functional Logic

* **Status Resolution Layer**
    * The module first resolves the selected ZUS status into a legally meaningful calculation scenario.
    * Only one status can be active at a time.
    * Any status change must instantly invalidate the previous social-contribution breakdown and recompute all dependent values.

* **ZUS Base Resolution**
    * If `Brak ulgi` is selected, the social contribution base is the statutory standard entrepreneur base, i.e. the declared amount not lower than 60% of the projected average monthly wage for the applicable calculation year.
    * If `Składka preferencyjna` is selected, the social contribution base is the statutory reduced entrepreneur base, i.e. the declared amount not lower than 30% of the minimum wage for the applicable calculation year.
    * If `Ulga na start` is selected, the social contribution base for business social insurance is 0 PLN. In this case the user pays only health insurance from business activity.
    * If `Umowa o pracę` is selected, the business social contribution base may be treated as 0 PLN **only under the statutory assumption that the employment relationship independently covers mandatory social insurance at least at the minimum required threshold**. If the application does not collect salary/base data from the employment contract, this option must be interpreted narrowly as: **“employment contract meeting the minimum-wage threshold for exemption from business social contributions.”**
    * If the user’s real employment arrangement does not meet that threshold, the application should not silently keep business social ZUS at 0 PLN. In a simplified calculator without extra employment inputs, this must be explained as a legal assumption in UI help text or tooltip.

* **Eligibility Semantics for Each Status**
    * `Ulga na start` is a temporary startup relief and should be treated as a declarative status unless the calculator has enough data to verify eligibility.
    * `Składka preferencyjna` is also a temporary relief status and should likewise be treated as declarative unless the calculator can verify the entitlement window and exclusions.
    * If the application later introduces start date or business history validation, this module must support:
        * `Ulga na start` for 6 full calendar months from business start,
        * followed by `Składka preferencyjna` for 24 full calendar months from entering social insurance,
        * with suspension periods counting toward these statutory windows.
    * If no such timeline inputs exist, the module must not pretend to calculate eligibility automatically; it should only calculate the declared status correctly.

* **Contribution Processing Workflow**
    1. Determine the active ZUS status.
    2. Resolve the statutory base for that status.
    3. Apply retirement insurance (emerytalne), disability insurance (rentowe), and accident insurance (wypadkowe) against the resolved base where applicable.
    4. Check the `Dobrowolne ubezpieczenie chorobowe` flag. If enabled and legally allowed for the resolved status, apply sickness insurance to the same social base.
    5. Determine whether Labor Fund / Solidarity Fund (FP/FS) should be added.
    6. Aggregate all social items into a single `Suma ZUS (Społeczne)`.
    7. Pass the aggregated amount into downstream tax and health contribution logic.

* **Detailed Status-Specific Contribution Behavior**
    * **Brak ulgi**
        * Social insurance applies in full on the standard entrepreneur base.
        * Voluntary sickness insurance may be added if selected.
        * FP/FS may apply, but only if statutory conditions are met.
    * **Składka preferencyjna**
        * Social insurance applies on the reduced base.
        * Voluntary sickness insurance may be added if selected.
        * FP/FS should normally not apply because the reduced base is below the threshold typically required for FP/FS liability.
    * **Ulga na start**
        * Pension, disability, accident, sickness, and FP/FS from business activity must all equal 0 PLN.
        * Health contribution remains mandatory.
    * **Umowa o pracę**
        * Pension, disability, accident, sickness, and FP/FS from business activity must all equal 0 PLN only under the valid statutory employment-threshold assumption.
        * Health contribution from business activity remains mandatory because employment contract and business activity are separate titles for health insurance.

* **FP/FS Determination Logic**
    * FP/FS must not be treated as a simple by-product of `Brak ulgi` only.
    * FP/FS apply only when the entrepreneur is mandatorily covered by pension and disability insurance from the business title and when the statutory threshold conditions are met for the given month.
    * In simplified calculator mode, if age, gender, and other exception data are not collected, the module must either:
        * use a documented assumption, or
        * clearly note that the result represents the standard/default case.
    * The module must never add FP/FS for `Ulga na start`.
    * The module must never add FP/FS when the resolved business social base is 0 PLN.

* **Voluntary Sickness Insurance Logic**
    * Voluntary sickness insurance is available only where business social insurance actually exists.
    * If the active status resolves the business social base to 0 PLN, the sickness checkbox must be ignored in calculation and should preferably be visually disabled or auto-cleared.
    * The sickness amount must be calculated from the same active social base as other social contributions.

* **Inter-Module Data Flow (Health & Tax Impact)**
    * The calculated `Suma ZUS` is passed to the health contribution engine and to the tax engine.
    * For `Skala podatkowa` and `Podatek liniowy 19%`, paid social contributions reduce the income base before PIT and health calculations are finalized according to the applicable yearly rules.
    * For `Ryczałt`, paid social contributions reduce the relevant revenue-based tax base according to the applicable deduction rules of the selected calculation year.
    * ZUS status does **not** independently switch off health contribution. Health contribution must always be processed for the business activity.
    * For health contribution logic, the module must rely on a **year-versioned legal parameter set**. It must not hardcode one year’s health rules as universal, especially where the law changes between calendar years.

* **Calculation Assumptions**
    * Unless the calculator explicitly supports partial-month simulations, the module assumes a full-month status for the selected regime.
    * Unless the UI collects a custom declared base, the module assumes the statutory **minimum allowed base** for the chosen status, not a voluntarily higher entrepreneur declaration.
    * Component amounts should be rounded to two decimal places (PLN/grosz) using a consistent calculation policy, and the total should be the sum of rounded components.

## 4. Output & Reporting Metrics

| Output Metric | Description |
| :--- | :--- |
| **ZUS** | The aggregate monthly social security deduction for the business title, including retirement, disability, accident, optional sickness insurance, and FP/FS only when legally applicable for the resolved status. |
| **Zdrowotna** | The mandatory monthly health insurance contribution for the business activity, always calculated even when social ZUS from business equals 0 PLN due to `Ulga na start` or valid `Umowa o pracę` overlap. |
| **Przychód netto miesięcznie** | The final monthly take-home result, recalculated after applying the selected ZUS status, resulting social contributions, health contribution, PIT, and other downstream deductions already supported by the calculator. |

## 5. Business Rules & Constraints
* **Mutual Exclusivity Rule**: The ZUS status selector must allow only one active state at a time. Combining `Ulga na start`, `Składka preferencyjna`, `Brak ulgi`, and `Umowa o pracę` within one monthly scenario is not allowed.
* **Declarative Status Rule**: If the calculator does not collect historical/legal validation data, status selection must be treated as a user declaration. The application must not imply that it has automatically confirmed statutory eligibility.
* **Ulga na Start Duration Rule**: `Ulga na start` is a temporary regime intended for 6 full calendar months. If the application does not support date-based validation, this limitation must be explained to the user in help content or tooltip text.
* **Preferential ZUS Duration Rule**: `Składka preferencyjna` is a temporary regime intended for 24 full calendar months after entry into social insurance. Suspension months count toward that statutory period. If the application does not support timeline tracking, this must be communicated as an assumption.
* **Former Employer Exclusion Rule**: Both `Ulga na start` and `Składka preferencyjna` are not universally available if the entrepreneur performs for a former employer the same scope of work performed as an employee in the current or previous calendar year. If the app cannot verify this, eligibility must remain declarative.
* **Prior Business Exclusion Rule**: Preferential relief statuses are not generally available where the entrepreneur conducted non-agricultural business activity within the statutory lookback window before starting the new business. If history is not collected, the app must not silently assume eligibility beyond the user declaration.
* **Employment Contract Precision Rule**: `Umowa o pracę` must not be interpreted as “any employment contract.” It should mean the specific overlap scenario in which employment already creates mandatory social insurance at or above the required statutory threshold. This assumption must be made explicit.
* **Sickness Insurance Constraint**: `Dobrowolne ubezpieczenie chorobowe` must automatically calculate to 0 PLN and should be disabled, auto-cleared, or ignored if `Ulga na start` or valid `Umowa o pracę` is active.
* **Mandatory Health Insurance Rule**: Health insurance must still be calculated for business activity even if social ZUS from business is reduced to 0 PLN by `Ulga na start` or valid `Umowa o pracę`.
* **FP/FS Constraint**: FP/FS must never be added when the resolved business social base is 0 PLN. For standard ZUS, FP/FS should be added only if the statutory threshold conditions are met; it must not be hardcoded as universally applicable in every standard case.
* **Accident Insurance Default Rule**: Accident insurance rates may vary by payer profile and reporting history. If the calculator does not collect individualized accident-rate inputs, it must use one documented default statutory rate for the generic entrepreneur scenario.
* **No FGŚP for Sole Proprietor Self-Contribution Rule**: The module should not introduce FGŚP into the entrepreneur’s own social ZUS calculation, because it is not part of the standard self-contribution set represented by this calculator flow.
* **Dynamic Annual Updates Rule**: All bases, thresholds, rates, and health-linkage rules must be versioned by the applicable legal year. Social and health logic from different legal years must not be mixed in one simulation.
* **Full-Month Simplification Rule**: If the calculator does not support start/end/suspension dates within a month, this module must assume a full month of status applicability. Partial-month social prorations and month-split status transitions are out of scope for this simplified mode.
* **Minimum-Base Assumption Rule**: Unless a custom declared base input exists, the module must calculate social contributions from the minimum statutory base for the selected status.
* **Immediate UI Recalculation Rule**: Any change to ZUS status must immediately refresh `ZUS`, `Zdrowotna`, and `Przychód netto miesięcznie`, and clear any stale line items inherited from the previously selected regime.

## Expert Recommendations & Edge Cases
* Clarified that `Umowa o pracę` is legally too broad as a label; the module should interpret it as **employment contract meeting the social-insurance exemption threshold**, otherwise the result may be misleading.
* Added the missing distinction between **status selection** and **legal eligibility verification**. This is critical because the current input set does not prove entitlement to startup or preferential relief on its own.
* Added the missing statutory lifecycle of startup reliefs: `Ulga na start` and `Składka preferencyjna` are time-bound and should not be modeled as permanent states.
* Tightened FP/FS logic. The original version was too simplified by binding FP/FS mainly to the selected status, while in practice FP/FS depend on additional statutory conditions and should not be hardcoded blindly.
* Added the requirement that the sickness toggle must be auto-ignored or disabled whenever the resolved business social base is 0 PLN.
* Added an explicit **full-month simulation assumption** so the calculator does not accidentally imply support for partial-month proration or mid-month regime transitions.
* Added a **minimum-base assumption** to make clear that the calculator models the statutory minimum entrepreneur base unless the UI explicitly allows a higher declared basis.
* Added a **default accident-rate assumption** because a generic B2B calculator typically lacks payer-specific accident-rate data.
* Added a **year-versioning rule** so the module remains legally stable across annual ZUS and health-rule changes and does not mix 2025-style and later-year health contribution logic.
* Recommended tooltip/help-text improvements rather than new input fields, preserving the current structural concept while materially improving legal correctness and user understanding.