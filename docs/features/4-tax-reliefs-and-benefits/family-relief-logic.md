# Functional Specification: Family Relief Logic (Ulga dla rodzin 4+)

## 1. Executive Summary
The Family Relief (PIT-0 dla rodzin 4+) functionality is a tax calculation module within the B2B calculator that applies the Polish PIT exemption available to taxpayers who, in a given tax year, raise at least four qualifying children. Its core purpose is to accurately simulate the exemption of up to 85,528 PLN of eligible annual revenue from income tax, while preserving the standard calculation paths for ZUS and health insurance where applicable.

This feature delivers business value by improving the realism of net-income projections for eligible entrepreneurs and by reducing the risk of misleading tax simulations. In the calculator context, the module must work as a declaration-based forecasting mechanism: when the toggle is enabled, the engine assumes that the user meets the legal conditions for the relief and applies the exemption chronologically across the tax year, while clearly signaling that final entitlement is always confirmed in the annual return.

## 2. Input & Configuration Parameters

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| Family Relief 4+ Toggle (Ulga dla rodzin 4+) | `Yes` / `No` (Checkbox/Toggle) | Activates PIT-0 for Families 4+ logic. When enabled, the calculator assumes the current taxpayer is legally entitled to the relief and applies the statutory annual exemption limit to eligible revenue used for PIT calculations. This toggle must affect PIT only and must not suppress ZUS social or health contributions. |
| Taxation Form (Forma opodatkowania) | `Tax Scale` (Skala), `Flat Tax` (Liniowy), `Lump Sum` (Ryczałt) | Determines how non-exempt amounts are taxed after the Family Relief limit is consumed. The exemption must be applied before the standard PIT computation for the selected form. For Tax Scale and Flat Tax, the remaining tax base continues through the normal income-tax formula. For Lump Sum, the remaining non-exempt revenue continues through the selected lump-sum rate logic. |

## 3. Core Functional Logic
The processing engine for the Family Relief logic modifies the PIT calculation path only. The workflow should operate as follows:

* **Eligibility Assumption for Calculator Purposes:**
    * When the toggle is enabled, the calculator assumes the user satisfies the legal conditions for PIT-0 for Families 4+ in the analyzed tax year.
    * The calculator should treat the toggle as a user declaration, not as independently verified legal proof.
    * The UI should make it clear that final entitlement is settled annually and may differ from the estimate if family circumstances changed during the year.

* **Who the Relief Is Intended to Represent:**
    * The relief applies to the current taxpayer only.
    * The calculator must not assume automatic sharing or transfer of the limit between spouses/partners.
    * If both parents are eligible in real life, each parent has their own separate annual limit, but this calculator should model only the current user’s own relief unless a separate spouse module explicitly exists elsewhere.

* **Qualifying Family Condition:**
    * The relief should be considered available only if, in the relevant tax year, the taxpayer has at least four qualifying children under Polish PIT rules.
    * Qualifying children may include:
        * minor children,
        * adult children receiving care allowance / supplementary care allowance or social pension,
        * adult children up to age 25 who are in qualifying education and who do not exceed the statutory annual income threshold defined by law.
    * The qualifying condition should be treated as satisfied even if the fourth child qualifies only for part of the year (for example, birth of the fourth child late in the year). Therefore, the feature must support full-year annual relief estimation even when the four-child condition arose during the year.

* **Annual Exemption Threshold Tracking:**
    * The statutory exemption limit is **85,528 PLN per tax year per taxpayer**.
    * The engine must track cumulative annual **eligible revenue/przychód**, not only post-cost income/d dochód.
    * This is a critical rule: the annual PIT-0 limit is consumed by qualifying revenue chronologically from the start of the year.
    * The engine must not create a separate additional 85,528 PLN pool if the taxpayer is also eligible for another PIT-0 type relief elsewhere in the application. Family Relief 4+ shares the same statutory annual cap with other zero-PIT exemptions from the same legal group.

* **Chronological Application Rule:**
    * The exemption must be applied in chronological order, starting from the first eligible revenue earned in the year.
    * For forecasting scenarios, the calculator should consume the relief from January onward within the simulated tax year, regardless of which month the user currently edits.
    * If the user changes the toggle from `No` to `Yes`, the engine should recompute year-to-date results from the start of the year rather than only from the current month onward.

* **Tax Base Reduction by Taxation Form:**
    * **Tax Scale (Skala):**
        * Eligible annual revenue is first reduced by the unused portion of the Family Relief limit.
        * After the exempt portion is removed, the remaining taxable result must continue through the standard Tax Scale logic, including normal deductible costs, social contribution handling, and tax-free amount logic.
        * The often-cited 115,528 PLN figure may be shown as explanatory help text, but it must **not** be hardcoded as a universal business-calculation shortcut in place of the actual tax formula.
    * **Flat Tax (Liniowy):**
        * Eligible annual revenue is first reduced by the unused portion of the Family Relief limit.
        * The remaining taxable result then continues through the standard Flat Tax calculation path.
        * The relief does not create a tax-free amount equivalent under Flat Tax; only the statutory Family Relief exemption is applied.
    * **Lump Sum (Ryczałt):**
        * Eligible annual revenue is first reduced by the unused portion of the Family Relief limit.
        * The remaining non-exempt revenue is then taxed using the applicable lump-sum rate selected elsewhere in the calculator.
        * Costs do not reduce the Lump Sum tax base, but the Family Relief still shields eligible revenue from PIT up to the statutory limit.

* **Interaction with Standard Tax-Free Allowance (Kwota wolna od podatku):**
    * For **Tax Scale** only, the Family Relief exemption works alongside the standard annual tax-free amount mechanism.
    * However, implementation must follow the actual Tax Scale algorithm and not rely solely on a simplified “85,528 + 30,000” shortcut for all B2B cases.
    * This is especially important in a business calculator where deductible costs and contribution deductions may cause the practical PIT trigger point to differ from a simple revenue-based explanation.

* **Health Insurance Independence:**
    * The Family Relief affects PIT only.
    * Health insurance contributions remain payable according to the selected taxation form and applicable ZUS rules.
    * The feature must not set health contribution to zero solely because PIT becomes zero.
    * The same principle applies to social insurance contributions unless another dedicated module changes them.

* **Annual Reconciliation Principle:**
    * The calculator may apply the relief in monthly estimates, but final entitlement is annual.
    * If the taxpayer was not using the relief in ongoing advances but is entitled to it annually, the annual output should still reflect the relief benefit.
    * Conversely, if entitlement is lost retrospectively during the year, the annual output must reflect the loss of relief for the full year.

## 4. Output & Reporting Metrics

| Output Metric | Description |
| :--- | :--- |
| Income Tax (Zaliczka na PIT) | Monthly and annual PIT should reflect the Family Relief chronologically. PIT may remain at 0 PLN while the exemption shields eligible revenue, but only for the PIT component and only until the annual relief limit is exhausted. |
| Net Income (Na rękę) | The final monthly and annual take-home amount should increase during the period in which Family Relief reduces PIT. The increase must come only from lower PIT, not from artificial reduction of ZUS or health contributions. |
| Effective Tax Rate | The overall annual effective PIT burden should decrease as exempt revenue is applied. This metric should remain consistent with the selected taxation form and the remaining non-exempt tax base. |
| Family Relief Used | The calculator should display how much of the 85,528 PLN annual limit has already been consumed in the current simulation year. |
| Family Relief Remaining | The calculator should display how much of the statutory annual exemption is still available. This improves transparency in partial-year and irregular-income scenarios. |
| Annual Relief Status Note | A short status note should indicate whether the simulation assumes full-year entitlement and whether the result is subject to annual verification based on children’s status and income conditions. |

## 5. Business Rules & Constraints
* **Statutory Limit:** The maximum exemption is strictly capped at **85,528 PLN per calendar year per taxpayer**. The number of children above four does not increase this limit.
* **Current Taxpayer Scope:** The calculator models the relief for the currently analyzed taxpayer only. Unused limit of one parent must not be transferred to the other parent within this feature.
* **Shared PIT-0 Cap:** The 85,528 PLN limit is a combined annual cap for this relief and other PIT-0 exemptions from the same statutory group. The engine must not stack multiple separate 85,528 PLN limits for one taxpayer.
* **Relief Base Definition:** The exemption is applied to eligible annual **revenue/przychód**, not as a flat deduction from annual tax only and not as a purely income-based threshold.
* **Sequential / Chronological Exhaustion:** The limit must be consumed in chronological order from the beginning of the year.
* **Tax Scale Caution:** On Tax Scale, the calculator must continue through the regular tax-free amount mechanism after the Family Relief exemption is consumed. It must not oversimplify the logic into a fixed universal “zero PIT until 115,528 PLN revenue” rule for all B2B cases.
* **Applicability Constraint:** The relief applies only to PIT. It does not remove ZUS społeczne or ZUS zdrowotne obligations.
* **Eligibility Dependence on Child Status:** If one of the qualifying adult studying children exceeds the statutory annual income threshold, the taxpayer may lose entitlement to the relief for the whole tax year. The calculator should therefore treat this as an annual-risk condition, not a purely monthly one.
* **Partial-Year Qualification:** The four-child condition does not need to be met for the full year. If it is met at any point during the tax year, annual entitlement may still arise.
* **Ineligible Revenue Types:** The feature must not extend the exemption to revenue types that are not legally covered by PIT-0 for Families 4+.
* **Documentation Disclaimer:** The calculator may estimate the relief, but it does not replace formal tax documentation or annual settlement requirements.

## Expert Recommendations & Edge Cases
* Replace the current oversimplified “income for Tax Scale / Flat Tax, revenue for Lump Sum” description with the legally safer rule that the **85,528 PLN limit is tracked against eligible annual revenue**, while the downstream PIT formula still depends on the selected tax form.
* Do not hardcode the “115,528 PLN” figure as a universal business rule. In a B2B calculator with deductible costs and contribution effects, that value should remain explanatory only.
* Add a visible **“used / remaining relief limit”** indicator. Without it, users cannot understand why PIT appears mid-year after several zero-tax months.
* Treat the toggle as a **legal declaration by the user**, and add a short warning that final entitlement is verified annually.
* Support **retroactive full-year annual benefit** when the fourth child is born or starts qualifying late in the year. This is a major real-life edge case and should be reflected in annual calculations.
* Add an explicit annual warning for the **adult child income threshold**. This is one of the highest-risk edge cases because exceeding the statutory threshold may invalidate the relief for the full year.
* Ensure recalculation is **year-to-date and chronological** whenever the toggle changes, taxation form changes, or annual revenue assumptions change.
* Keep the relief strictly separated from health insurance logic. A common functional mistake is to reduce health burden when PIT becomes zero.
* Keep the feature scoped to the current taxpayer only. Do not implicitly merge spouse limits, spouse income, or spouse eligibility inside this feature unless a separate spouse/joint-taxation module explicitly governs that behavior.