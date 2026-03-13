# Functional Specification: Cost Management Module

## 1. Executive Summary
The Cost Management Module is a core component of the B2B Calculator designed to allow independent contractors (JDG) to enter business expenses and accurately project how those expenses affect monthly profitability, tax burden, VAT settlement, and take-home income. The module must distinguish between the **economic cash outflow** of a cost and its **tax effect**, because in Polish JDG settlements these values are not always identical.

Its primary business value lies in providing a precise and transparent simulation of how entered costs influence:
- the **income tax base (PIT)** for taxation forms where costs are relevant,
- the **health contribution base** where the contribution depends on income,
- the **deductible input VAT** where the user is an active VAT taxpayer,
- and the final **net income ("na rękę")** after taxes, ZUS, health contribution, and actual out-of-pocket business costs.

The module must correctly handle statutory asymmetries between:
- standard business costs,
- vehicle costs under mixed private/business use,
- vehicle costs under exclusive business use,
- and users taxed under **Tax Scale**, **Flat Tax**, or **Lump Sum (Ryczałt)**.

The scope of this module is limited to the monthly simulation of manually entered business costs and their immediate impact on calculator outputs. It does not independently introduce accounting-period recognition, amortization schedules, payment deferrals, annual tax corrections, or document-level bookkeeping workflows unless already handled elsewhere in the calculator.

## 2. Input & Configuration Parameters

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| Cost Name / Label | Free-text string | User-friendly identifier for the expense in the summary list and detailed breakdown. |
| Net Amount | Numeric (PLN) | Base amount used to calculate VAT amount, non-deductible VAT, PIT-deductible value, and real cash outflow. Must support 2 decimal places. |
| VAT Rate | 0%, 5%, 8%, 23%, ZW (Exempt) | Determines the theoretical VAT amount on the expense. For `0%` and `ZW`, deductible input VAT is always `0`. |
| Cost Category / Type | Standard, Car - Mixed Use, Car - Business Use | Triggers specific statutory logic for VAT deductibility and PIT/health deductibility. |
| Taxation Form (Dependent Global Setting) | Tax Scale, Flat Tax, Lump Sum (Ryczałt) | Determines whether the cost reduces PIT and health contribution bases. Under Lump Sum, costs do not reduce PIT base and do not affect health contribution tiers. |
| VAT Registration Status (Dependent Global Setting) | Active VAT Taxpayer, VAT Exempt / No VAT on Revenue | Determines whether any input VAT may offset output VAT. If the user is not an active VAT taxpayer, the entire VAT portion becomes non-deductible and increases economic cost. |
| Calculation Month / Tax Year Context (Dependent Global Setting) | Current month/year context from calculator | Required for applying year-specific tax rules, especially health contribution minimums and thresholds. |
| Cost Entry State | Active / Removed / Edited | Any change must trigger immediate recalculation of all dependent outputs without requiring a manual refresh. |

## 3. Core Functional Logic

* **Cost Normalization & Validation:**
    * The engine accepts one or more cost entries and processes each entry independently before aggregation.
    * `Net Amount` must be greater than or equal to `0.00` and rounded to 2 decimal places using a consistent financial rounding strategy across the calculator.
    * Empty, null, negative, or non-numeric amounts must be rejected at input level.
    * If `VAT Rate = 0%` or `VAT Rate = ZW`, then `Expense VAT Amount = 0.00`.
    * The module must preserve the original entered cost values and calculate derived values separately to avoid compounding rounding errors during edits.

* **Derived Expense Components:**
    * For each cost entry, the engine calculates:
        * `Expense VAT Amount`
        * `Deductible VAT Amount`
        * `Non-Deductible VAT Amount`
        * `Tax-Deductible Cost Base`
        * `Economic Out-of-Pocket Cost`
    * Recommended logical sequence:
        1. Calculate theoretical VAT from `Net Amount` and selected `VAT Rate`.
        2. Determine VAT deductibility based on `VAT Registration Status` and `Cost Category / Type`.
        3. Determine the portion of VAT that is non-deductible.
        4. Add non-deductible VAT to the cost base where applicable.
        5. Apply the category-specific PIT/health deductibility percentage.
        6. Aggregate all entries into module totals.

* **Income Tax (PIT) Base Adjustment:**
    * *Tax Scale (12%/32%) & Flat Tax (19%):*
        * The module reduces the taxable income base by the **Tax-Deductible Cost Base** derived for each cost item.
        * For standard costs, the deductible cost base equals:
            * `Net Amount`, if VAT is fully deductible, or
            * `Net Amount + Non-Deductible VAT Amount`, if VAT is not deductible in whole or in part.
        * For car costs, category-specific vehicle rules apply.
    * *Lump Sum (Ryczałt):*
        * The engine must not reduce the PIT base using entered costs.
        * Costs remain relevant only for:
            * economic take-home simulation,
            * and VAT settlement, if the user is an active VAT taxpayer.
        * The interface must make this distinction explicit to avoid suggesting that costs lower lump-sum tax.

* **Health Contribution (Składka Zdrowotna) Adjustment:**
    * *Tax Scale & Flat Tax:*
        * The module lowers the income passed to the health-contribution engine by the same **Tax-Deductible Cost Base** used for PIT.
        * The downstream health-contribution engine must then enforce the statutory minimum monthly contribution applicable to the given calculation period.
        * The module must not assume that high costs can reduce the payable health contribution below the statutory floor.
    * *Lump Sum (Ryczałt):*
        * Costs do not affect the health contribution amount.
        * The health contribution remains determined by statutory revenue thresholds/tier logic rather than expense volume.

* **VAT Offset Workflow (VAT Naliczony vs. Należny):**
    * The module calculates input VAT from the entered expense and selected VAT rate.
    * Deductible input VAT is then determined as follows:
        * *Standard:*  
          `Deductible VAT Amount = full Expense VAT Amount`, but only if the user is an active VAT taxpayer.
        * *Car - Mixed Use:*  
          `Deductible VAT Amount = 50% of Expense VAT Amount`, but only if the user is an active VAT taxpayer.
        * *Car - Business Use:*  
          `Deductible VAT Amount = 100% of Expense VAT Amount`, but only if the user is an active VAT taxpayer and the calculator assumes the legal conditions for exclusive business use are satisfied by choosing this category.
        * *VAT Exempt / No VAT on Revenue:*  
          `Deductible VAT Amount = 0.00` regardless of VAT rate selected on the cost.
    * `Non-Deductible VAT Amount = Expense VAT Amount - Deductible VAT Amount`.
    * The engine subtracts the aggregated deductible VAT from the user's output VAT.
    * If total deductible input VAT exceeds output VAT for the period, the module must not present a misleading negative "VAT to pay". Instead, it should resolve to:
        * `VAT Payable = 0`, and
        * `VAT Surplus / Overpayment Candidate = remaining deductible VAT balance`.

* **Vehicle Cost Algorithm (Edge Case Processing):**
    * *Car - Mixed Use:*
        * The engine applies mixed-use limitations in two stages:
            1. Only `50%` of VAT is deductible.
            2. The non-deducted VAT is added to the tax cost base.
            3. Only `75%` of that resulting base is deductible for PIT/health purposes where costs are relevant.
        * Formula:
            * `Expense VAT Amount = Net Amount × VAT Rate`
            * `Deductible VAT Amount = 50% × Expense VAT Amount` (if active VAT taxpayer, otherwise `0`)
            * `Non-Deductible VAT Amount = Expense VAT Amount - Deductible VAT Amount`
            * `Tax-Deductible Cost Base = 75% × (Net Amount + Non-Deductible VAT Amount)` for Tax Scale / Flat Tax
            * Under Lump Sum, `Tax-Deductible Cost Base = 0`
        * This means that for a VAT-exempt user, the entire VAT portion becomes non-deductible, and the PIT/health deductible base for mixed-use car costs must be calculated from the gross-like amount:  
          `75% × (Net Amount + full VAT Amount)`.
    * *Car - Business Use:*
        * The engine assumes full business treatment:
            * `100%` deductible VAT when the user is an active VAT taxpayer,
            * `100%` of the eligible cost base deductible for PIT/health where costs are relevant.
        * If the user is VAT-exempt, VAT is not deducted and increases the cost base for PIT/health.
        * The system should clearly communicate that this category presumes the stricter legal/business-use conditions are met; otherwise the user should choose mixed use.

* **Standard Cost Algorithm:**
    * For standard non-vehicle expenses:
        * If the user is an active VAT taxpayer and the expense VAT is deductible, PIT/health cost base should normally use `Net Amount`.
        * If the VAT is not deductible, the non-deductible VAT must increase the PIT/health cost base:
            * `Tax-Deductible Cost Base = Net Amount + Non-Deductible VAT Amount` for Tax Scale / Flat Tax.
        * Under Lump Sum:
            * `Tax-Deductible Cost Base = 0`
            * `Deductible VAT Amount` may still apply if the user is an active VAT taxpayer.

* **Economic Out-of-Pocket Cost Logic:**
    * The module must distinguish tax deductibility from real cash impact.
    * For take-home simulation, the relevant expense value is not always the same as the PIT-deductible amount.
    * `Economic Out-of-Pocket Cost` should represent the effective monthly cost borne by the user after VAT recovery:
        * *Standard, active VAT taxpayer with fully deductible VAT:*  
          `Economic Out-of-Pocket Cost = Net Amount`
        * *Standard, VAT-exempt:*  
          `Economic Out-of-Pocket Cost = Net Amount + full VAT Amount`
        * *Car - Mixed Use, active VAT taxpayer:*  
          `Economic Out-of-Pocket Cost = Net Amount + Non-Deductible VAT Amount`
        * *Car - Business Use, active VAT taxpayer:*  
          `Economic Out-of-Pocket Cost = Net Amount`
    * This distinction is essential because the amount reducing PIT can differ from the amount reducing disposable cash.

* **Net Take-Home Extrapolation:**
    * The global real-time formula must use the effective economic cost, not blindly the net invoice value.
    * Recommended interpretation:
        * `Final Net Pay = Revenue After Taxes and Contributions - Total Economic Out-of-Pocket Costs`
    * Where the module contributes:
        * lower PIT (for Tax Scale / Flat Tax),
        * potentially lower health contribution (for Tax Scale / Flat Tax, subject to minimum),
        * lower VAT payable (if active VAT taxpayer),
        * and direct reduction of disposable cash through actual business spending.
    * The UI should prevent confusion by showing both:
        * the **cash cost** borne by the user,
        * and the **tax-deductible amount** used in PIT/health calculations.

## 4. Output & Reporting Metrics

| Output Metric | Description |
| :--- | :--- |
| Total Monthly Costs | Aggregated sum of the effective economic cost of all entered expenses for the selected month. This is the value that should impact the user's cash-based take-home view. |
| Total Entered Net Costs | Aggregated sum of all entered net amounts before VAT treatment, useful for transparency in the summary panel. |
| Adjusted PIT Base | Recalculated income base used for income-tax assessment after applying eligible cost deductions for Tax Scale / Flat Tax. |
| Effective Deductible Cost Total | Aggregated amount of costs that actually reduce PIT and health bases. This value may differ materially from Total Monthly Costs. |
| Deductible VAT Total | Aggregated sum of input VAT that offsets output VAT in the selected period. |
| Non-Deductible VAT Total | Aggregated sum of VAT that cannot be deducted and is therefore absorbed into the user's real cost and, where applicable, tax-deductible cost base. |
| VAT Payable After Costs | Net VAT still payable after applying deductible input VAT from costs. |
| VAT Surplus / Overpayment Candidate | Remaining deductible VAT when input VAT from costs exceeds output VAT for the calculation period. |
| Health Contribution Payable | Dynamically updated health contribution after income-based cost effects are applied where legally relevant, always respecting the statutory minimum. |
| Final Net Income (Na rękę) | Ultimate net amount remaining after taxes, ZUS, health contribution, and actual economic business costs are applied. |

## 5. Business Rules & Constraints
* **Lump Sum Overlap Rule:**  
  If the user switches taxation form to `Lump Sum (Ryczałt)`, the system must immediately disable the effect of costs on PIT and health-contribution calculations while preserving:
    * the economic cash effect of the cost,
    * and VAT deduction logic for active VAT taxpayers.

* **VAT Registration Dependency:**  
  Input VAT from costs can reduce output VAT only when the user is configured as an active VAT taxpayer. If the user is VAT-exempt / has no VAT on revenue, deductible input VAT must equal `0`, and the full VAT portion becomes part of the user's real cost.

* **Non-Deductible VAT Capitalization Rule:**  
  Any VAT that cannot be deducted must be rolled into the cost base used for PIT/health calculations where the taxation form allows cost deduction. This rule is especially important for:
    * VAT-exempt users,
    * mixed-use car costs,
    * and any partially deductible VAT scenario.

* **Vehicle Category Rule:**  
  The selected vehicle category must drive both VAT treatment and PIT/health deductibility:
    * `Car - Mixed Use` = 50% VAT deductibility + 75% PIT/health deductibility of net amount plus non-deductible VAT
    * `Car - Business Use` = 100% VAT deductibility and 100% PIT/health deductibility, subject to the user's assumption that formal legal conditions for exclusive business use are met

* **Health Contribution Minimum Threshold:**  
  Under Tax Scale and Flat Tax, high costs may reduce monthly income to zero or loss. The system must still enforce the statutory minimum health contribution applicable to the relevant contribution period. This threshold must be configurable by period and must not be hard-coded as a timeless constant.

* **Zero-Floor Tax Liability:**  
  Monthly PIT payable cannot become negative. If deductible costs exceed revenue for the period, the monthly PIT liability must floor at `0`. The simulator may internally preserve negative operating result for informational purposes, but it must not display a negative monthly tax refund unless that logic is explicitly supported elsewhere.

* **VAT Zero-Floor Display Rule:**  
  If deductible input VAT exceeds output VAT, the calculator must not show a negative "VAT to pay" amount as if it were a standard payable value. The result must be split into:
    * `VAT Payable = 0`
    * `VAT Surplus / Overpayment Candidate > 0`

* **0% and ZW VAT Rule:**  
  For cost entries using `0%` or `ZW`, the module must calculate `Expense VAT Amount = 0` and therefore `Deductible VAT Amount = 0` regardless of VAT registration status.

* **Precision and Validation Rule:**  
  All monetary calculations must support 2 decimal places. The system must reject negative amounts and avoid cumulative rounding drift when multiple costs are added, edited, and removed.

* **Immediate Recalculation Rule:**  
  Any create, update, or delete action on a cost entry must immediately refresh:
    * PIT base,
    * health contribution,
    * VAT payable/surplus,
    * total monthly costs,
    * and final take-home income.

* **Transparency Rule:**  
  For each entered cost, the module should expose enough detail in the UI or expanded summary to explain why:
    * the cash impact,
    * VAT impact,
    * and PIT/health impact  
  are not always the same.

## Expert Recommendations & Edge Cases
1. **Separate “cash cost” from “tax-deductible cost” in the UI.**  
   This is the single most important improvement. Users often assume that the full invoice amount reduces PIT and that the same amount should be subtracted from net take-home. In Polish JDG logic, these values diverge frequently—especially for VAT-exempt users and mixed-use cars.

2. **Add an explicit per-cost breakdown in the detailed view.**  
   For every cost row, show:
   - Entered net amount
   - VAT amount
   - Deductible VAT
   - Non-deductible VAT
   - PIT/health deductible amount
   - Effective out-of-pocket cost  
   This will make the module auditable and dramatically reduce confusion.

3. **Clarify the meaning of `Car - Business Use`.**  
   This category should not behave like a casual toggle. It implicitly assumes stricter formal/legal conditions for exclusive business use. At minimum, the UI should explain this through tooltip/help text so users do not overestimate deductions.

4. **Handle VAT-exempt users more explicitly.**  
   A frequent logical gap in calculators is correctly disabling VAT deduction while still rolling non-deductible VAT into the tax-cost base for Scale/Flat Tax. This must be handled consistently for both standard expenses and vehicle costs.

5. **Do not hard-code health-contribution minimums.**  
   The module should consume statutory configuration by period. This is particularly important because the minimum may depend on the health-contribution year and not only on the calendar year.

6. **Support VAT-surplus display instead of negative VAT payable.**  
   When costs are high and revenue is low, deductible input VAT may exceed output VAT. Showing a negative payable amount is misleading; a separate surplus value is clearer and more legally aligned.

7. **Edge case: Mixed-use car for VAT-exempt user.**  
   The module must compute PIT/health deductibility from `75% × (net + full VAT)` because no VAT is deductible at all. This is a common place for undercalculating the cost effect.

8. **Edge case: Standard expense with partially or fully non-deductible VAT.**  
   The module should not always assume that PIT cost base equals net amount. If VAT is non-deductible, the deductible cost base should increase accordingly for taxation forms where costs matter.

9. **Edge case: Zero revenue with costs entered.**  
   The module should still show:
   - real economic business cost,
   - zero PIT payable,
   - statutory minimum health contribution where applicable,
   - and VAT result based on active VAT status and available output VAT logic.

10. **Add concise explanatory tooltips.**  
    Recommended tooltip themes:
    - “Under Lump Sum, costs do not lower income tax.”
    - “If you are not an active VAT taxpayer, VAT from purchases is not deductible.”
    - “For mixed-use cars, only part of VAT and PIT cost is deductible.”
    - “Your cash cost may differ from your tax-deductible cost.”

11. **Ensure row edits are deterministic and reversible.**  
    Editing VAT rate, amount, or vehicle category must fully recompute the row from original input values rather than mutating previously derived values. This avoids hidden calculation drift.

12. **Preserve module scope discipline.**  
    Keep this module focused on cost-entry treatment and its immediate monthly simulation effect. Do not expand it with unrelated annual reliefs, amortization schedules, or broader accounting flows unless those are intentionally modeled in separate dedicated modules.