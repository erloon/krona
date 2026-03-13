# Functional Specification: Tax and Deduction Engine (tax-and-deduction-engine.md)

## 1. Executive Summary
The Tax and Deduction Engine is the core computational heart of the B2B Calculator. Its primary purpose is to transform a contractor’s gross business inflow into a compliant and explainable “Net Profit on Hand” by applying the Polish rules for PIT, Health Insurance, Social Security deductions, and additional statutory burdens such as the Solidarity Levy where applicable.

This engine must not be treated as a single flat formula. It is an orchestration layer that consumes normalized values from adjacent modules (Revenue, Costs, ZUS status, voluntary sickness, and dedicated relief modules), then calculates:
- the correct taxable base,
- the correct health contribution base,
- the final PIT burden,
- the final cash outcome visible to the user.

The business value lies in delivering a calculation that is not only numerically correct, but legally structured, auditable, and consistent with how Polish B2B taxation works in practice. The engine must distinguish between:
- **cash-flow deductions** (what reduces “money on hand”),
- **tax deductions** (what reduces PIT or taxable revenue/income),
- **annual threshold logic** (tax brackets, lump-sum health tiers, relief caps, solidarity levy),
- **year-specific parameterization** (tax year and health-contribution year must not be hardcoded assumptions).

## 2. Input & Configuration Parameters
| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **Taxation Model** | Tax Scale (12%/32%), Flat Tax (19%), Lump Sum (Ryczałt) | Determines the PIT algorithm, health contribution logic, deductibility rules, and eligibility of specific preferences such as joint settlement handling. |
| **ZUS Contribution Type** | Ulga na start, Preferential / Small ZUS, Standard / No Relief, Concurrent Employment (UoP-equivalent handling if supported) | Provides the social contribution payload forwarded into the engine and determines whether social contributions are present at all. Health contribution remains a separate mandatory branch. |
| **Revenue (Net Invoice / Business Revenue)** | Numerical value (PLN) | The primary source value used for tax, health, and final cash-flow calculations. Must be normalized to the active calculation period and annual/YTD projection context. |
| **Business Expenses** | Numerical value (PLN) | Reduce the PIT base for Tax Scale and Flat Tax. For Lump Sum they do **not** reduce taxable revenue, but they still reduce final cash profit. |
| **Lump Sum Rate** | 2%, 3%, 5.5%, 8.5%, 12%, 14%, 15%, 17% | Active only when “Lump Sum” is selected. Determines the PIT-equivalent rate applied to taxable revenue after permitted deductions. |
| **Sickness Insurance** | Yes / No (Optional) | If enabled and legally available under the selected ZUS scheme, increases the social contribution payload and indirectly changes tax results by increasing deductible social charges. |
| **Joint Settlement** | Single, With Spouse, Single Parent / analogous annual preference if implemented | Relevant only for Tax Scale annual tax logic. It must not be treated as a simple UI multiplier; it changes the annual PIT computation path. |
| **Calculation Period Context** | Monthly, Annual, or internal YTD projection layer | Determines how the engine interprets thresholds and when annual caps or tier changes are triggered. |
| **Statutory Parameter Set** | Versioned tax-year and contribution-year configuration | Supplies rates, caps, thresholds, minimum health contribution values, deduction caps, and revenue eligibility limits. This must be externalized from the formula layer. |

## 3. Core Functional Logic
The engine operates as a sequential and state-aware processing pipeline. It must calculate tax in the correct legal order rather than using a simplified “single pass” subtraction model.

* **Step 0: Input Normalization & Validation**
    * Resolve the active statutory parameter set for the selected simulation year.
    * Separately resolve the **tax year** and the **health-contribution year** if the legal rules require different effective periods.
    * Validate incompatible combinations before calculation starts:
        * Joint Settlement cannot modify Flat Tax calculations.
        * Joint Settlement cannot modify Lump Sum calculations inside this engine.
        * Lump Sum rate is mandatory only when Lump Sum is selected.
        * Expenses remain visible in cash-flow even when they are ignored for Lump Sum tax purposes.
    * Convert current-period data into an annual/YTD threshold model so the engine can correctly detect:
        * crossing 30,000 PLN tax-free threshold on Tax Scale,
        * crossing 120,000 PLN second bracket threshold,
        * crossing 60,000 / 300,000 PLN Lump Sum health tiers,
        * crossing the 1,000,000 PLN Solidarity Levy threshold,
        * exhausting any annual health-deduction cap on Flat Tax.

* **Step 1: Resolve Deductible Social Contribution Payload**
    * Retrieve the social contribution payload from the ZUS module.
    * Include mandatory social components and optional sickness insurance if enabled and legally valid.
    * Treat `Ulga na start` and any equivalent “social ZUS = 0” status as:
        * **Social Contributions = 0 PLN**
        * **Health Insurance = still applicable**
    * Only contributions that are legally deductible may enter the PIT deduction branch.
    * The engine must prevent double counting of the same amount as both:
        * a direct deduction from income/revenue, and
        * a cost item reducing the same tax base.

* **Step 2: Calculate Pre-Health Tax Base**
    * For **Tax Scale / Flat Tax**:
        * `PreHealthIncome = Revenue - DeductibleBusinessExpenses - DeductibleSocialContributions - OtherLegallyDeductibleSelfPaidCharges`
    * For **Lump Sum**:
        * `PreHealthTaxableRevenue = Revenue - DeductibleSocialContributions`
        * Business Expenses are **ignored for PIT purposes** at this stage.
    * Floor control:
        * Negative pre-health tax bases must not generate negative PIT.
        * A loss or zero-income scenario does not automatically eliminate health contribution obligations.

* **Step 3: Health Insurance Calculation**
    * **Tax Scale**
        * Health Insurance = 9% of actual income used for health purposes.
        * The engine must enforce the statutory minimum monthly health contribution for an active business month when the calculated amount is lower than the legal floor.
    * **Flat Tax**
        * Health Insurance = 4.9% of actual income used for health purposes.
        * The engine must enforce the statutory minimum monthly health contribution for an active business month when the calculated amount is lower than the legal floor.
    * **Lump Sum**
        * Health Insurance is not calculated from actual monthly profit.
        * The engine must determine the active tier from the annual/YTD revenue level:
            * Tier 1: up to 60,000 PLN
            * Tier 2: above 60,000 PLN up to 300,000 PLN
            * Tier 3: above 300,000 PLN
        * The monthly contribution is then calculated from the legally fixed tier base for that period.
    * Important sequencing rule:
        * Health Insurance must be calculated **before** any permitted tax deduction of that health contribution is applied to Flat Tax or Lump Sum PIT logic.

* **Step 4: Apply Health-Deduction Rules to the PIT Base**
    * **Tax Scale**
        * Paid health contributions do not reduce PIT and do not reduce the tax base.
    * **Flat Tax**
        * Paid health contributions may reduce the tax result only up to the statutory annual cap for the active year.
        * The engine must support one explicit deduction path only:
            * deduct from income, **or**
            * include in tax-deductible costs,
          but never both for the same amount.
        * The engine must track year-to-date usage of the annual cap.
    * **Lump Sum**
        * 50% of paid health contributions may reduce taxable revenue.
        * The engine must reduce only the legally deductible portion and only once.
    * Deduction timing assumption:
        * The engine should calculate based on **paid** contributions.
        * If the calculator works in simplified monthly simulation mode, it should explicitly assume that due contributions for the period are paid in that same period.

* **Step 5: Income Tax (PIT) Calculation**
    * **Tax Scale**
        * Calculate tax on the annual/cumulative taxable income.
        * Apply:
            * 12% up to the first threshold,
            * 32% above the threshold,
            * annual tax-reducing amount resulting from the statutory tax-free threshold.
        * The engine must not simulate Tax Scale as a naïve monthly flat percentage.
        * Monthly PIT advance shown in the UI should be derived from:
            * cumulative annual tax due,
            * minus prior calculated advances,
            * respecting the annual tax-free threshold.
    * **Flat Tax**
        * PIT = 19% of the taxable income after legally permitted deductions.
        * No tax-free allowance applies.
    * **Lump Sum**
        * PIT-equivalent amount = selected Lump Sum rate × taxable revenue after permitted deductions.
        * Business Expenses must not enter this formula.
    * Zero floor:
        * PIT cannot be negative.
        * If deductions exceed the base, PIT is displayed as 0 PLN.

* **Step 6: Joint Settlement / Annual Preference Logic**
    * This branch applies only to **Tax Scale**.
    * For spouse-based annual settlement:
        * combine the eligible taxable incomes of both spouses after their individual deductions,
        * divide by 2,
        * calculate tax according to the Tax Scale,
        * multiply the result by 2.
    * The engine must not implement this as a simplistic “double threshold” shortcut only.
    * If spouse income is blank, the engine should treat it as 0 only if the UI explicitly allows zero-income spouse simulation.
    * Any analogous single-parent annual preference should follow the dedicated annual rule set and remain isolated from Flat Tax and Lump Sum calculations.

* **Step 7: Solidarity Levy**
    * For **Tax Scale** and **Flat Tax**, the engine must calculate an additional **4% levy** on the legally defined annual surplus over **1,000,000 PLN**.
    * This levy is:
        * annual in nature,
        * separate from standard PIT,
        * not applicable to Lump Sum calculations.
    * For transparency, it should be shown as a distinct line item in the detailed breakdown even if the UI also presents a combined total burden.

* **Step 8: Final Aggregation**
    * Final cash outcome must be calculated as:
        * `Net Profit on Hand = Revenue - BusinessExpenses - SocialContributions - HealthInsurance - PIT - SolidarityLevy`
    * Important distinction:
        * On **Lump Sum**, Expenses do not reduce tax, but they **do** reduce cash.
    * The engine must therefore always keep separate:
        * **Tax Base**
        * **Health Base**
        * **Cash Result**

## 4. Output & Reporting Metrics
| Output Metric | Description |
| :--- | :--- |
| **Total ZUS (Social)** | Sum of deductible and non-deductible social contribution components passed from the ZUS module, including optional sickness insurance where applicable. |
| **Health Insurance** | The mandatory health contribution calculated according to the active taxation model. |
| **Deductible Health Portion Used** | The portion of paid health contribution that was legally used to reduce PIT base or taxable revenue (0 for Tax Scale). |
| **Tax Base After Deductions** | The final taxable income or taxable revenue used by the PIT branch after deductible social/health adjustments. |
| **Income Tax (PIT)** | The calculated PIT liability for the selected taxation model, excluding the Solidarity Levy if shown separately. |
| **Solidarity Levy** | The additional 4% annual levy on qualifying surplus income over 1,000,000 PLN for Tax Scale / Flat Tax. |
| **Net Profit (Na rękę)** | Final disposable amount after subtracting business expenses, social contributions, health contribution, PIT, and the Solidarity Levy where applicable. |
| **Effective Mandatory Burden Rate** | Percentage of revenue consumed by statutory burdens (Social ZUS + Health + PIT + Solidarity Levy). Business expenses should not be mixed into this rate unless a separate cash-burn metric is intentionally presented. |
| **Total Cost of Business** | Sum of business expenses plus all mandatory deductions and taxes. |
| **Calculation Trace / Detailed Breakdown** | A structured explanation of the formula path used, including active tax model, threshold crossings, minimum health floor activation, and deductions applied. |

## 5. Business Rules & Constraints
* **Tax-Year Parameterization**
    * All rates, caps, deduction limits, thresholds, and statutory bases must be stored in a versioned parameter source.
    * The engine must not hardcode year-sensitive amounts inside formula logic.

* **Separate Health-Contribution Period Handling**
    * The minimum health contribution and its floor logic may depend on a statutory contribution period different from the standard calendar tax year.
    * The engine must therefore resolve health floors from the correct legal period, not from a generic “current year” assumption.

* **Tax-Free Threshold on Tax Scale**
    * The engine must respect the annual tax-free threshold and corresponding annual tax reduction.
    * PIT advances under Tax Scale should remain 0 until the cumulative taxable income exceeds the effective annual threshold.

* **Joint Settlement Availability Constraint**
    * Joint Settlement is available only for Tax Scale.
    * Switching to Flat Tax or Lump Sum must disable this modifier in the tax engine.
    * The engine must not silently keep spouse-related modifiers active after such a switch.

* **Single Parent / Analogous Annual Preference**
    * If supported, this must be implemented as a dedicated annual preference path, not as a cosmetic variation of the spouse toggle.
    * It must remain unavailable for Flat Tax and Lump Sum logic inside this engine.

* **Health Deduction Rules by Tax Model**
    * Tax Scale: health contribution is not tax-deductible.
    * Flat Tax: health contribution is partially deductible only within the annual statutory cap.
    * Lump Sum: only 50% of paid health contribution reduces taxable revenue.
    * Double counting of health contribution is strictly forbidden.

* **Expense Treatment on Lump Sum**
    * Business Expenses must not reduce taxable revenue under Lump Sum.
    * They must still remain part of the final cash-flow result and reporting.

* **Negative Base Handling**
    * The engine must never display negative PIT.
    * Negative taxable income or revenue after deductions must be floored at 0 for PIT purposes.
    * Low/zero income does not automatically remove health contribution obligations for an active business month.

* **Lump Sum Eligibility Warning**
    * The engine must trigger a warning when the statutory prior-year revenue limit for Lump Sum eligibility is exceeded.
    * The warning should use the official PLN equivalent for the relevant year, derived from statutory conversion rules.
    * The calculator may still allow hypothetical simulation, but it must not present it as legally available without warning.

* **Solidarity Levy Separation**
    * The Solidarity Levy must remain a separate computational branch from PIT.
    * It should not be hidden inside the standard PIT amount in the detailed explanation layer.

* **30-Fold ZUS Base Cap**
    * The engine must not interpret the 30-fold rule as an “income cap”.
    * It applies to the annual base for **pension and disability** contributions only.
    * It does **not** stop accident insurance, sickness insurance, or health insurance.
    * If the social contribution payload provided by the ZUS module already reflects a 30-fold cap, the tax engine must use that payload without reintroducing capped components.

* **Deprecated Middle Class Relief**
    * The engine must not calculate or reference the former middle-class relief.
    * Any legacy code path using that relief must remain disabled.

* **Payment-Timing Assumption**
    * Tax deductions for social and health contributions are legally tied to paid amounts.
    * If the calculator does not support an explicit payment calendar, it must document the assumption that the current period’s contributions are paid within the same modeled period.

## Expert Recommendations & Edge Cases
1. **Separate “tax result” from “cash result” explicitly.**  
   The original logic mixed taxable base handling with cash-on-hand handling. This is especially dangerous for Lump Sum, where expenses do not reduce tax but do reduce final cash.

2. **Model annual thresholds cumulatively, not per isolated month.**  
   Tax Scale brackets, Lump Sum health tiers, Flat Tax health deduction caps, and the Solidarity Levy all require annual or YTD tracking.

3. **Do not implement joint settlement as a simple doubled threshold.**  
   The correct approach is annual combined-income calculation, division by two, scale tax computation, then multiplication by two.

4. **Track health deduction usage as a stateful annual counter.**  
   For Flat Tax, once the annual deduction cap is exhausted, further paid health contributions must stop reducing the PIT base.

5. **Expose a detailed breakdown trace in the UI.**  
   Recommended visible steps:
   - Revenue
   - Expenses
   - Social ZUS used for deduction
   - Pre-health tax base
   - Health contribution
   - Deductible health portion used
   - Final PIT base
   - PIT
   - Solidarity Levy
   - Final net result

6. **Handle low-income / zero-income months explicitly.**  
   In such months:
   - PIT may legitimately be 0,
   - business expenses may still reduce cash,
   - health contribution may still be due under minimum-floor rules,
   - the engine must not collapse all outputs to zero.

7. **Protect against stale legal constants.**  
   The engine should read from a year-versioned parameter table so that statutory changes do not require formula rewrites.

8. **Prevent hidden state leaks after switching tax model.**  
   Example:
   - user selects Tax Scale + Joint Settlement,
   - then switches to Lump Sum,
   - spouse logic must be fully ignored by the tax engine and not survive in cached calculations.

9. **Keep the 30-fold rule in the ZUS layer, but validate its downstream effect here.**  
   The tax engine should consume a capped social payload and ensure that only the relevant social components disappear after the cap, not the entire contribution bundle.

10. **Make the simplified simulator assumption explicit.**  
    If the application does not support intra-year changes of tax form, ZUS scheme, or legal status, the engine should document that the current selection is applied uniformly across the simulated year.