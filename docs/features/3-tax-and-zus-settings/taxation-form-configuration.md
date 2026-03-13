# Functional Specification: Taxation Form Configuration

## 1. Executive Summary
The Taxation Form Configuration feature is the core decision layer of the B2B calculator. It allows users operating as sole proprietorships (Jednoosobowa Działalność Gospodarcza - JDG) in Poland to select and compare the three primary tax regimes used in the calculator: Progressive Tax (Skala podatkowa), Linear Tax (Podatek liniowy 19%), and Lump Sum (Ryczałt). Its business value is to accurately forecast monthly and annual net income by selecting the correct statutory rules for Income Tax (PIT) and Health Contribution (Składka zdrowotna), while also orchestrating the availability and impact of regime-dependent modifiers such as Joint Settlement, IP Box, Relief for Return, and PIT-0 for Families.

This feature is not only a UI selector. It is a configuration gatekeeper that:
- activates the correct tax algorithm,
- enforces legal compatibility between options,
- applies year-specific statutory thresholds and limits,
- and prevents users from combining mutually exclusive or misrepresented tax preferences.

A critical product requirement is that the feature must distinguish between:
- **tax regimes** (`Skala`, `Liniowy`, `Ryczałt`), and
- **tax preferences / overlays** (`IP Box`, `Ulga na powrót`, `PIT-0 dla rodzin 4+`, `Rozliczenie z małżonkiem`).

In particular, IP Box must not be treated as a standalone primary taxation form. It is a preferential tax mechanism layered on top of `Skala podatkowa` or `Podatek liniowy`, and its effect should be presented as an annual preference outcome rather than as a separate core tax regime.

## 2. Input & Configuration Parameters
| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **Tax Year / Statutory Dataset** | `Configured fiscal year supported by the calculator` | Determines all year-sensitive thresholds, floors, deduction caps, and statutory constants used by the selected taxation form. This parameter must drive values such as health contribution minimums, deduction caps, and annual thresholds rather than relying on hardcoded constants. |
| **Form of Taxation** (Forma opodatkowania) | `Skala podatkowa`, `Podatek liniowy 19%`, `Ryczałt` | Determines the primary calculation algorithm for Income Tax (PIT), Health Contribution rules, deductible cost treatment, and the compatibility matrix for secondary tax modifiers. |
| **Lump Sum Rate** (Stawka ryczałtu) | `17%`, `15%`, `14%`, `12%`, `8.5%`, `5.5%`, `3%`, `2%` | *Condition: Appears only if `Ryczałt` is selected.* Determines the flat percentage applied to taxable revenue under the lump-sum model. |
| **Joint Settlement** (Rozliczenie z małżonkiem) | `Boolean (True/False)` | *Condition: Available only if `Skala podatkowa` is selected.* Applies joint tax computation principles for scale taxation. If the calculator does not collect spouse income separately, the result must be explicitly treated as a simplified scenario or an assumption-based estimate. |
| **IP BOX** | `Boolean (True/False)` | *Condition: Available only for `Skala podatkowa` and `Podatek liniowy 19%`.* Activates an annual preferential-tax estimate for qualified IP income. Must not be treated as a separate primary taxation form and must not be available for `Ryczałt`. |
| **Relief for Return** (Ulga na powrót) | `Boolean (True/False)` | Applies PIT exemption logic to eligible business income/revenue up to the statutory annual relief pool. Eligibility must be assumed or validated externally because the relief is time-limited and available only within the legally defined four-year window. |
| **PIT-0 for Families** | `Boolean (True/False)` | Applies PIT exemption logic to eligible business income/revenue for taxpayers with 4+ children, up to the statutory annual relief pool. Eligibility is legal-status dependent and should be treated as declarative unless the calculator collects enough verification data. |
| **Relief Pool Tracking** | `Internal computed state` | Aggregates all active “zero-PIT” exemptions handled by this feature. Prevents Relief for Return and PIT-0 for Families from being applied as two separate 85,528 PLN pools. |
| **Tax Form Eligibility Warning State** | `Internal computed state / UI warning` | Displays warnings when the selected taxation form may be legally unavailable or economically inconsistent, e.g. choosing `Ryczałt` while the user exceeds the statutory previous-year eligibility limit. |

## 3. Core Functional Logic
The processing engine dynamically reacts to the Form of Taxation input and configures the correct PIT and Health Contribution logic. The feature must first resolve the selected tax year, then validate configuration compatibility, and only after that execute the form-specific calculation path.

### Common Pre-Processing Rules
Before running any taxation-form workflow, the engine must execute the following common logic:

* **Statutory Year Resolution**
    * Load all year-dependent thresholds, floors, and caps from the selected statutory dataset.
    * No threshold related to health contribution minimums, deduction caps, or annual tax limits may be hardcoded permanently in the algorithm layer.

* **Compatibility Matrix Resolution**
    * `Joint Settlement` is compatible only with `Skala podatkowa`.
    * `IP BOX` is compatible only with `Skala podatkowa` and `Podatek liniowy 19%`.
    * `IP BOX` must be disabled when `Ryczałt` is selected.
    * `Joint Settlement` must be disabled when `Podatek liniowy 19%` or `Ryczałt` is selected.
    * `Relief for Return` and `PIT-0 for Families` may coexist functionally in the UI, but they must consume the same annual exemption pool rather than two separate caps.

* **Shared “Zero-PIT” Relief Pool Logic**
    * The feature must maintain a single annual exemption pool for active reliefs handled here.
    * If both `Relief for Return` and `PIT-0 for Families` are active, the total exempted income/revenue must never exceed the single statutory annual cap.
    * The engine must allocate exempted amounts sequentially and transparently to avoid double-counting.

* **Health Contribution Independence**
    * `Relief for Return`, `PIT-0 for Families`, and `Joint Settlement` change PIT behavior only.
    * These modifiers must not reduce or suppress the Health Contribution calculation.
    * `IP BOX` changes the annual PIT outcome for qualified IP income, but it does not create a separate health-contribution regime.

---

* **Workflow 1: Progressive Tax (Skala podatkowa) Engine**
    * **Tax Base Calculation:** Revenue minus deductible Business Costs minus deductible Social Security (ZUS społeczne) contributions.
    * **Algorithm:**
        * Apply the annual tax-free mechanism for scale taxation according to the active statutory year.
        * Income up to the statutory first threshold is taxed at the lower rate.
        * Income above the statutory first threshold is taxed at the higher rate.
        * The implementation should use the annual tax-reducing amount logic rather than rely solely on a simplified “0% up to X PLN” shortcut, especially when reliefs partially reduce the base.
    * **Health Contribution:**
        * Calculated as the statutory percentage of monthly/period income for scale taxation.
        * If income is zero or negative, the feature must still apply the statutory minimum health contribution for the selected year, if required by the active legal dataset.
    * **Modifier Action: Joint Settlement**
        * If `Joint Settlement` is active, the engine should follow the legal joint-tax structure: combine modeled taxable income, divide by two, calculate tax according to scale, then multiply by two.
        * If the application does not collect spouse income as an explicit input, the calculator must mark the result as an assumption-based estimate and clarify that the outcome reflects only the income modeled in the calculator.
    * **Modifier Action: Relief for Return / PIT-0 for Families**
        * The shared annual relief pool reduces PIT exposure on eligible income.
        * Under scale taxation, this relief interacts with the normal tax-free mechanism; therefore, the engine must calculate the relief first and then apply the scale-tax formula to any remaining taxable income.
    * **Modifier Action: IP BOX**
        * If `IP BOX` is active, the calculator must not replace current-year advance PIT with a pure 5% rate.
        * Instead, it should calculate the regular scale-based PIT path first and then present an annual preferential result or annual tax-saving estimate for the qualified IP component.

* **Workflow 2: Linear Tax (Podatek liniowy 19%) Engine**
    * **Tax Base Calculation:** Revenue minus deductible Business Costs minus deductible Social Security (ZUS społeczne) contributions, adjusted by the configured treatment of deductible health contributions if the product supports that optimization.
    * **Algorithm:**
        * Apply a flat 19% PIT rate to the calculated tax base.
        * No tax-free allowance is applied.
        * PIT must never fall below 0 PLN, even if deductions reduce the base below zero.
    * **Health Contribution:**
        * Calculated as the statutory percentage of monthly/period income for linear taxation.
        * A statutory minimum monthly health contribution must be enforced using the active tax-year dataset.
    * **Health Contribution Deduction Logic**
        * Paid health contributions may affect the PIT result according to the active legal rules.
        * If the product does not expose a user choice between “deduct from income” and “book as tax-deductible cost”, the calculator must use one documented default method consistently.
        * The annual deductible amount must be capped by the statutory yearly limit for the selected year.
    * **Modifier Action: Joint Settlement**
        * Not available. The toggle must be disabled and visually marked as incompatible.
    * **Modifier Action: Relief for Return / PIT-0 for Families**
        * The shared annual exemption pool may reduce PIT exposure on eligible business income.
        * The exemption affects PIT only and must not reduce Health Contribution.
    * **Modifier Action: IP BOX**
        * If `IP BOX` is active, the engine must calculate linear-tax advances normally and then show an annual preferential-tax estimate for the qualified IP portion.
        * The 5% treatment must not be represented as the primary monthly tax regime.
    * **Solidarity Levy Trigger**
        * If annual taxable income exceeds 1,000,000 PLN, the engine must calculate the additional 4% levy on the excess and include it in annual reporting.

* **Workflow 3: Lump Sum (Ryczałt) Engine**
    * **Tax Base Calculation:** Taxable revenue equals Revenue reduced only by deductions legally available under the lump-sum model. Business Costs must not reduce the tax base.
    * **Cost Handling Rule:**
        * Costs remain relevant to cash-flow and net-income presentation.
        * Costs must be excluded from the tax-base formula under `Ryczałt`.
    * **Algorithm:**
        * Apply the user-selected lump-sum percentage directly to taxable revenue.
        * The algorithm must support deductions legally available under ryczałt, including deductible Social Security contributions and the permitted portion of paid health contributions.
    * **Health Contribution:**
        * Calculated using the tiered ryczałt model based on annual revenue thresholds from the active statutory year.
        * In forecast mode, the engine should determine the most realistic tier using annualized/projected revenue.
        * The system should explicitly communicate that final annual settlement may differ if actual annual revenue crosses a statutory threshold.
    * **Health Contribution Deduction Logic**
        * A legally permitted portion of paid health contributions reduces taxable revenue under the ryczałt model.
        * This deduction must be applied consistently and only once.
    * **Modifier Action: Joint Settlement**
        * Not available. The toggle must be disabled and visually marked as incompatible.
    * **Modifier Action: IP BOX**
        * Not available. The toggle must be disabled and visually marked as incompatible.
    * **Modifier Action: Relief for Return / PIT-0 for Families**
        * The shared annual exemption pool may reduce PIT exposure on eligible revenue under ryczałt.
        * These reliefs do not change the Health Contribution tier logic.
    * **Eligibility Warning**
        * If the application has access to prior-year revenue or a user declaration of eligibility, the system should warn or block `Ryczałt` when the statutory entry threshold is exceeded.

## 4. Output & Reporting Metrics
| Output Metric | Description |
| :--- | :--- |
| **Total Income Tax (PIT)** | The calculated monthly and annual PIT amount after applying the selected tax regime, compatible modifiers, and year-specific legal thresholds. For IP Box scenarios, this should distinguish between standard advance-tax logic and the annual preferential result. |
| **Health Contribution (Zdrowotna)** | The calculated mandatory health-insurance fee specific to the selected taxation form and active statutory year. Must remain visible even when PIT-relief toggles reduce income tax to zero. |
| **Effective Tax Rate** | A computed percentage representing the total burden of PIT, Health Contribution, and applicable ZUS elements against gross revenue. |
| **Net Income (Przychód netto)** | The final take-home amount after subtracting business costs, ZUS, Health Contribution, and PIT according to the selected taxation form. |
| **Applied Relief Amount** | The annual and monthly amount of income/revenue shielded by the shared “zero-PIT” relief pool within this feature. Prevents the user from misreading separate toggles as separate statutory caps. |
| **Tax Form Compatibility / Warning State** | A visible informational output showing whether selected modifiers are legally compatible with the chosen taxation form and whether the result contains assumptions (e.g. simplified Joint Settlement without spouse-income input). |

## 5. Business Rules & Constraints
* **Tax Regime vs Preference Distinction:** `Skala podatkowa`, `Podatek liniowy 19%`, and `Ryczałt` are primary taxation forms. `IP BOX`, `Relief for Return`, `PIT-0 for Families`, and `Joint Settlement` are modifiers/overlays and must not be modeled as equivalent primary forms.
* **Cost Exclusion (Ryczałt):** If `Ryczałt` is selected, the application must immediately exclude business costs from PIT-base calculations. Costs may still reduce cash-flow and displayed net income, but they must not lower the ryczałt tax base.
* **Joint Settlement Compatibility:** Joint Settlement is available only for `Skala podatkowa`. Selecting `Podatek liniowy 19%` or `Ryczałt` must disable this toggle.
* **Joint Settlement Assumption Disclosure:** If spouse income is not modeled in the calculator, the UI must explicitly state that the result is a simplified estimate and not a complete family tax simulation.
* **IP BOX Compatibility:** IP Box must be unavailable for `Ryczałt`. It may be enabled only when `Skala podatkowa` or `Podatek liniowy 19%` is selected.
* **IP BOX Settlement Rule:** IP Box must not replace current-year standard advance tax with an immediate 5% monthly tax regime. The calculator should present it as an annual preferential-tax estimate layered on top of the selected compatible taxation form.
* **Shared Relief Cap Validation:** `Relief for Return` and `PIT-0 for Families` must consume one shared annual exemption pool. The system must never apply them as additive, independent 85,528 PLN caps.
* **Relief Scope Rule:** `Relief for Return` and `PIT-0 for Families` reduce PIT exposure only. They do not reduce Health Contribution or social contributions.
* **Return Relief Time Window:** `Relief for Return` is a time-limited preference. If the application does not collect start-year eligibility data, the system must treat the toggle as declarative and should warn that legal entitlement depends on the taxpayer’s four-year relief window.
* **Family Relief Eligibility Caveat:** `PIT-0 for Families` depends on legal family-status conditions that may not be fully captured in this feature. The toggle should therefore be treated as a declaration unless the application explicitly captures detailed eligibility data.
* **Statutory Minimum Health Contribution:** For `Skala podatkowa` and `Podatek liniowy 19%`, the engine must enforce the statutory minimum health contribution based on the active year dataset, including cases where income is low, zero, or negative.
* **Year-Sensitive Thresholds:** All tax brackets, health-contribution floors, annual deduction caps, and lump-sum thresholds must be sourced from the active statutory year. They must not be fixed permanently in code or documentation.
* **Linear Health Deduction Cap:** Under `Podatek liniowy 19%`, the deductible treatment of paid health contributions must respect the annual statutory cap for the active year and must not be applied twice through multiple deduction paths.
* **Ryczałt Health Tier Rule:** Under `Ryczałt`, the health-contribution tier must follow statutory annual revenue thresholds for the active year. Forecast mode should use annualized/projected revenue, while annual reporting should reconcile against actual full-year revenue.
* **Ryczałt Eligibility Warning Rule:** If the application knows or asks for prior-year revenue, the system should warn or block the `Ryczałt` option when the statutory eligibility threshold is exceeded.
* **Solidarity Levy Rule:** The system must actively monitor the 1,000,000 PLN annual threshold for `Skala podatkowa` and `Podatek liniowy 19%`. Amounts above that level must trigger the additional 4% levy in annual reporting.
* **Non-Negative PIT Rule:** Regardless of deductions, reliefs, or negative tax base conditions, monthly and annual PIT may not be displayed below 0 PLN.

## Expert Recommendations & Edge Cases
1. **Correct the conceptual model of IP Box.** The original specification treated IP Box too much like an immediate standalone tax regime. It should be modeled as an annual preference overlay for `Skala` or `Liniowy`, not as a primary taxation form and not as a ryczałt-compatible option.
2. **Introduce a shared “zero-PIT” relief pool.** The original document treated `Relief for Return` and `PIT-0 for Families` as separate 85,528 PLN exemptions. This creates a legal overstatement. The calculator should apply one shared annual pool across active reliefs handled in this feature.
3. **Parameterize the statutory year.** The feature currently reads like thresholds are timeless constants. In practice, health-contribution floors, deduction caps, and thresholds are year-sensitive. This should be formalized at the configuration level.
4. **Make spouse-income assumptions explicit.** If Joint Settlement is offered without collecting spouse income, the current result is only an approximation. The UI and the algorithm description should disclose that limitation.
5. **Separate tax-base logic from cash-flow logic for ryczałt.** Costs must still influence take-home cash flow, but not ryczałt PIT. This distinction should be explicit in the feature to avoid product ambiguity.
6. **Handle low-income and loss months explicitly.** For `Skala` and `Liniowy`, PIT may fall, to 0 PLN, but health contribution may still be due at the statutory minimum. This is a common edge case that materially affects net-income forecasts.
7. **Prevent double application of health-contribution deductions.** In `Podatek liniowy 19%`, paid health contribution can influence PIT only via one documented deduction path and within the annual cap. In `Ryczałt`, only the legally deductible portion may reduce taxable revenue.
8. . **Warn on legal eligibility gaps instead of silently calculating.** `Ryczałt` eligibility, Return Relief duration, and Family 4+ entitlement can all be legally constrained by data that may not be captured in this feature. The product should use warnings or assumption labels rather than pretend full eligibility verification.
9. **Differentiate forecast mode from final annual settlement.** This is especially important for `Ryczałt` health tiers and `IP BOX`, where the final annual legal result may differ from a monthly simplified projection.
10. **Keep the compatibility matrix enforceable in the UI and engine.** The same constraints must be enforced both visually and in backend calculation logic, so incompatible combinations cannot slip through via stale UI state or direct API calls.