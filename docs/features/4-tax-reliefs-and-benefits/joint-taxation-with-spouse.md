# Functional Specification: Joint Taxation with Spouse

## 1. Executive Summary
The "Joint Taxation with Spouse" (Rozliczenie z małżonkiem) functionality allows B2B contractors in Poland to simulate the effect of filing an annual PIT return jointly with a spouse, but only within the legal framework of Polish joint settlement rules. The feature is relevant primarily for taxpayers settling business income under the Tax Scale (Skala podatkowa), where combining eligible annual incomes and taxing them as double the tax calculated on half of the joint base may reduce the total annual PIT burden.

This functionality is most beneficial when there is a significant difference between spouses’ annual incomes subject to the tax scale, especially when one spouse has low or zero scale-taxed income and the other approaches or exceeds the first tax threshold. The core objective of the feature is not to create a separate household calculator, but to improve the primary B2B user’s PIT simulation by incorporating the spouse’s eligible annual tax base into the annual settlement formula.

The feature must be treated as an **annual PIT optimization mechanism**. In product terms, it may still influence monthly “take-home” projections shown in the calculator, but these monthly values are only an averaged forecast of the annual outcome and must not be presented as the statutory monthly advance tax actually payable during the year.

## 2. Input & Configuration Parameters
| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| Taxation Form (Forma opodatkowania) | Tax Scale (Zasady ogólne / Skala podatkowa), Flat Tax (Podatek liniowy), Lump Sum (Ryczałt) | Joint taxation is available only for annual income taxed under the Tax Scale. If the primary B2B user switches to Flat Tax or Lump Sum, the joint taxation option must be reset, disabled, or hidden. A legal-note tooltip should clarify that exceptional “zero PIT-36L / zero PIT-28” cases are not part of the standard calculator path unless explicitly supported. |
| Joint Taxation Toggle | Yes / No | Activates the joint-tax simulation path. When enabled, the calculator must reveal spouse-related input fields and a legal assumptions note stating that joint filing is valid only if statutory conditions are met (marriage, marital property community, residency/treaty conditions, and no disqualifying taxation regimes for either spouse except legally allowed exceptions). |
| Spouse’s Annual Income (Dochód/Przychód małżonka) | Numeric value (PLN) ≥ 0 | This field must represent the **annual income eligible to enter the joint PIT calculation under the tax scale**, not every type of spouse income. If the spouse has salary, mandate contract, pension, or scale-taxed business income, the value entered must correspond to the spouse’s annual taxable base on the scale after spouse-specific deductible costs and social contributions, unless the calculator separately derives that base. Income taxed separately or finally (for example dividends, capital income taxed separately, or other non-scale items) must not be included here. |
| Spouse’s ZUS Contributions (Składki ZUS małżonka) | Numeric value (PLN) ≥ 0 (Optional, only when spouse gross business income is being converted to a taxable base) | This field is applicable only if the product supports entering the spouse’s gross business income and then converting it to a scale-taxed annual income base. It must deduct only spouse social contributions relevant to PIT base formation. It must not be used to reduce the spouse’s health contribution inside this module, because health contribution treatment remains individual and outside the joint PIT mechanism. If spouse income is already entered as an annual taxable base, this field should be hidden or ignored. |

## 3. Core Functional Logic
* **Availability & Validation Rule:**  
  The application actively listens to the "Taxation Form" state. The Joint Taxation toggle is structurally bound to the "Tax Scale" (Zasady ogólne). Changing the primary user’s form to 19% Flat Tax or Lump Sum immediately resets and disables the Joint Taxation toggle and clears spouse-specific derived values. The UI should additionally communicate that the feature is a legal simulation available only when joint annual filing conditions are met.

* **Legal Eligibility Assumption Layer:**  
  This module must not assume that selecting the toggle alone makes the taxpayer legally eligible. At minimum, the calculator must display an informational rule set stating that joint settlement is valid only when:
  * the spouses remained married and under marital property community for the full tax year, or from the date of marriage until the last day of the tax year;
  * they meet the relevant Polish tax residency or EU/EEA/Swiss 75% income conditions, if applicable;
  * neither spouse was subject, in a disqualifying way, to Flat Tax, Lump Sum on business activity, Tax Card, tonnage tax, or the shipbuilding activation regime during the year;
  * private rental taxed by lump sum and legally valid “zero PIT-36L / zero PIT-28” cases are exceptions and do not automatically disqualify joint filing, but these edge cases should be treated as legal exceptions rather than the calculator’s default operating mode.

* **Tax Base Consolidation:**  
  * The system calculates the primary user’s annual taxable income on the tax scale using the existing B2B engine (Revenue - Operating Costs - Social ZUS Contributions - any other upstream deductions from income already handled elsewhere in the calculator flow).
  * The system reads the spouse’s annual eligible tax-scale income from the spouse input path.
  * The system must combine only the income elements that legally enter the annual tax-scale PIT base. It must exclude income taxed separately, income taxed in a final withholding regime, and other amounts that do not enter joint PIT base formation.
  * In the simplified calculator mode, spouse input values below 0 must be rejected. The module should not allow a user to create an artificial household tax benefit by entering a negative spouse amount. If support for spouse loss settlement is ever added in a separate dedicated spouse engine, that logic must be modeled explicitly and not inferred from this field.

* **Joint Tax Calculation Algorithm (Current Polish Tax Scale):**
  * **Step 1:** Determine the *Primary User Eligible Annual Tax Base*.
  * **Step 2:** Determine the *Spouse Eligible Annual Tax Base*.
  * **Step 3:** Calculate the *Combined Household Tax Base* as the sum of those two eligible annual bases.
  * **Step 4:** Divide the *Combined Household Tax Base* by 2.
  * **Step 5:** Apply the standard Polish tax scale to the halved amount:
    * 12% tax on the amount up to 120,000 PLN,
    * reduced by the tax-reducing amount of 3,600 PLN,
    * 32% on the surplus above 120,000 PLN.
  * **Step 6:** If the tax computed on the halved base is negative, clamp it to 0.
  * **Step 7:** Multiply the resulting tax by 2 to establish the total annual PIT liability for the spouses under joint taxation.
  * **Step 8:** Compare the result to the primary user’s individual annual PIT scenario to compute the financial benefit of the joint-settlement option.

* **Rounding Rules:**  
  The annual tax base and final annual PIT values should follow Polish annual PIT rounding logic at the annual settlement level (full PLN). Monthly display values may retain grosz precision for UX readability, but they must be visibly labeled as derived estimates from the annual simulation rather than literal tax-return positions.

* **Tax-Free Allowance Handling:**  
  The calculator must not separately add another manual “extra tax-free allowance” after the joint tax formula is applied. The legal mechanism already embeds the doubled benefit by taxing half of the combined base and then multiplying the result by two. This effectively reflects a combined 60,000 PLN tax-free amount and a combined 240,000 PLN first-threshold capacity for the couple.

* **Health Contribution Isolation:**  
  Under Polish post-Polski Ład rules, health insurance contributions remain individualized. The calculator must compute the primary user’s health contribution only from the primary user’s own applicable health base. Joint taxation affects annual PIT only. The spouse input in this module must never reduce the primary user’s health contribution. Unless the product contains a separate spouse calculator, no spouse health contribution should be simulated here.

* **Solidarity Levy Isolation (Danina Solidarnościowa):**  
  Joint taxation does not average or neutralize the solidarity levy. If the primary user’s individual income tracked by the core engine exceeds the statutory threshold for solidarity levy, that levy must remain calculated individually and outside the halved joint base logic. The joint-settlement module may reduce PIT, but it must not suppress a separately due solidarity levy.

* **Pro-rata Monthly Distribution:**  
  Because the calculator presents monthly “na rękę” values, the system may distribute the annual joint-tax benefit across 12 months to show an estimated monthly effect. However, this must be explicitly treated as a **forecast allocation of annual tax benefit**, not as the actual statutory monthly advance calculation. This distinction is important because the legal election for joint settlement is made in the annual return, not in monthly advance payments.

## 4. Output & Reporting Metrics
| Output Metric | Description |
| :--- | :--- |
| Adjusted Income Tax (PIT) | The recalculated **annual** PIT liability under joint taxation, plus an optional estimated monthly equivalent derived from annual smoothing. If a monthly value is shown, it must be labeled as a forecast, not the exact monthly PIT advance due under tax law. |
| Net Income (Na rękę) | The primary B2B user’s recalculated take-home result after incorporating the annual PIT benefit of joint settlement. This metric should reflect PIT optimization only and must not imply any reduction in individualized health contribution. |
| Effective Tax Rate | A dynamically updated indicator of the tax burden after joint taxation is applied. The label must be precise enough to avoid ambiguity—for example, that this is an effective PIT view for the modeled B2B scenario affected by spouse joint settlement assumptions, not a full legal household tax ratio across all tax regimes. |
| Tax Savings Projection | The calculated delta in PLN between the primary user’s individual annual PIT scenario and the joint-taxation annual PIT scenario. This is the most important explanatory output for the feature and should always be based on annual values first, with monthly equivalents shown only as derived projections. |

## 5. Business Rules & Constraints
* **Annual Filing Nature of the Feature:**  
  Joint taxation with a spouse is an annual PIT settlement preference. The calculator may translate the annual result into monthly estimates for usability, but the legal mechanism itself belongs to the annual return and should not be represented as a direct month-by-month statutory settlement rule.

* **Tax Form Exclusivity – Refined Rule:**  
  The standard calculator path must allow joint taxation only when the primary user is taxed under the Tax Scale. However, the legal rule is not a simplistic “any lump sum or flat tax anywhere always blocks joint filing.” The module must account for the fact that:
  * business activity taxed with Flat Tax or Lump Sum generally disqualifies joint filing,
  * private rental taxed by lump sum does not by itself block joint filing,
  * “zero PIT-36L” and “zero PIT-28” edge cases may still preserve eligibility.
  For product safety, unsupported exceptions should be disclosed in the UI rather than silently modeled incorrectly.

* **Marriage and Marital Property Community Requirement:**  
  The feature is legally valid only if the spouses remained in marriage and marital property community for the full tax year, or from the date of marriage until year-end. If the real-life user situation does not satisfy this condition, the simulation result is only hypothetical and should not be presented as legally applicable.

* **Residency / Treaty Requirement:**  
  The feature assumes Polish tax residency eligibility rules are satisfied. In cross-border cases, joint settlement is possible only under additional EU/EEA/Swiss and 75%-of-income conditions. The calculator does not need to become a residency engine, but it should not imply universal eligibility.

* **Tax-Free Allowance Limits (Kwota wolna od podatku):**  
  The mechanism effectively applies a pooled 60,000 PLN tax-free amount through the half-base method. The calculator must avoid double-counting this benefit elsewhere in the tax flow.

* **First Tax Bracket Expansion:**  
  The 12% tax bracket is effectively stretched from 120,000 PLN to 240,000 PLN for the couple. The 32% rate starts only when the combined eligible annual tax base exceeds 240,000 PLN.

* **Excluded Income Types:**  
  The joint base must not include income that is not taxed under the annual tax scale mechanism. This includes, in particular, income taxed separately or finally outside the scale. The spouse income field therefore cannot be interpreted as “all annual earnings,” but only as the spouse’s eligible annual scale-taxed base relevant to joint PIT.

* **Zero Income Scenario:**  
  If the spouse’s eligible annual income is 0 PLN, the calculation remains fully valid. This is one of the main use cases for the feature, because the primary user can benefit from the spouse’s unused tax-free amount and unused first-threshold capacity.

* **Blank vs Zero Handling:**  
  Once Joint Taxation is enabled, an empty spouse income field should either:
  * default to 0 PLN with a visible helper note, or
  * remain required until the user explicitly confirms 0 PLN.
  The application must choose one behavior consistently. Silent ambiguity between “missing data” and “0 income” is not acceptable.

* **Negative Spouse Input Constraint:**  
  The spouse income input must not accept negative values in the simplified version of this calculator. If the spouse had a tax loss from a specific source, that scenario requires dedicated source-level modeling and must not be approximated by entering a negative number into a generic spouse field.

* **Spouse ZUS Input Constraint:**  
  Spouse ZUS input should exist only if the spouse entry path starts from a gross business value. If the spouse amount is already an annual tax-scale base, the field must be hidden or ignored to prevent double deduction.

* **Late Filing Edge Case:**  
  Filing the annual return after the standard deadline does not by itself invalidate the right to joint filing. Therefore, this feature should remain available in the calculator regardless of the current calendar date and must not be artificially disabled after the filing deadline.

* **Solidarity Tax Exclusion (Danina Solidarnościowa):**  
  Joint taxation must not be used to reduce, average, or avoid solidarity levy exposure. Any such levy remains individual and outside the joint PIT averaging algorithm.

## Expert Recommendations & Edge Cases
1. **Clarify the legal gate more precisely.**  
   The original version treated Flat Tax and Lump Sum as absolute blockers in every case. This is too rigid. The improved specification now reflects legally important exceptions such as private rental under lump sum and valid “zero PIT-36L / zero PIT-28” cases.

2. **Treat the feature explicitly as an annual settlement simulation.**  
   This is the single most important product clarification. Monthly values shown in the calculator should be framed as a distribution of annual tax benefit, not as literal monthly advance tax law.

3. **Correct the meaning of the spouse income field.**  
   The original wording risked mixing gross income, taxable income, business income, salary, and separately taxed income. The improved version defines the field as the spouse’s annual income that is actually eligible to enter the joint scale-tax PIT base.

4. **Add hard handling for ambiguous or risky inputs.**  
   The improved version introduces explicit rules for blank spouse income, zero income, negative values, and optional spouse ZUS usage so the feature does not silently produce distorted results.

5. **Separate PIT optimization from health contribution and solidarity levy logic.**  
   The improved version keeps this module focused strictly on joint PIT mechanics. It makes clear that neither health contribution nor solidarity levy should be incorrectly averaged through the spouse mechanism.

6. **Add non-blocking eligibility disclosure for real-world edge cases.**  
   The improved version introduces residency, marital property community, and statutory-regime assumptions as mandatory informational guidance, without turning this single feature into a full legal questionnaire.

7. **Protect against double-counting tax-free allowance.**  
   The improved version explicitly states that the doubled tax-free benefit is already embedded in the half-base formula, preventing accidental over-optimization in implementation.