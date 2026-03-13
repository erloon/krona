# IP Box Mechanism.md

# Functional Specification: IP Box Mechanism

## 1. Executive Summary
The IP Box mechanism is a specialized tax-preference module within the B2B calculator designed for Polish entrepreneurs who conduct Research and Development (R&D) activity and derive income from qualified intellectual property rights. In the context of this calculator, the feature should be treated primarily as a **PIT estimation mechanism for B2B users** operating under **Tax Scale** or **Flat Tax**, even though the legal regime also exists in CIT.

Its core purpose is to estimate the **annual tax effect** of applying the preferential **5% income tax rate** to **qualified income from qualified IP**, most commonly in this product context income related to **copyright in computer software**. The business value lies in helping IT professionals and other innovation-focused sole traders understand the potential year-end tax benefit while keeping the result aligned with the legal mechanics of IP Box: qualified income attribution, nexus-ratio limitation, and separate record-keeping requirements.

This module must not present IP Box as a simple monthly tax-rate switch. Functionally, it is an **overlay on top of the selected PIT form**, used to estimate the annual tax reconciliation result, not a replacement for standard monthly advance-tax logic.

## 2. Input & Configuration Parameters
The following inputs are required to activate and calculate the IP Box preference within the B2B context:

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **IP Box Eligibility** | Toggle (On/Off) | Activates the IP Box estimation logic; reveals/hides all related sub-parameters. When Off, the calculator must fully revert to the base tax model without any IP Box adjustments. |
| **Qualified Income %** | Numeric (0.00% - 100.00%) | Defines the estimated share of the user’s annual business income that is attributable to **qualified IP income**. This field must represent the portion of income connected to statutory IP Box income categories, not an arbitrary optimization slider. The label may remain as-is for UI continuity, but its tooltip must clarify that it refers to income attributable to qualified IP rights embedded in licenses, transferred rights, or qualified IP included in the price of a product/service. |
| **Qualified Costs (Category A)** | Currency Amount (PLN, >= 0) | Costs actually incurred for R&D activity carried out directly by the taxpayer and related to the qualified IP. Used in the nexus-ratio numerator and denominator. |
| **Qualified Costs (Category B)** | Currency Amount (PLN, >= 0) | Costs of acquiring R&D results related to the qualified IP from **unrelated entities**. Used in the nexus-ratio numerator and denominator. |
| **Qualified Costs (Category C)** | Currency Amount (PLN, >= 0) | Costs of acquiring R&D results related to the qualified IP from **related entities**. Used only in the nexus-ratio denominator. |
| **Qualified Costs (Category D)** | Currency Amount (PLN, >= 0) | Costs of acquiring the qualified IP right itself. Used only in the nexus-ratio denominator. |

Additional input behavior and validation requirements directly related to this feature:

- All A/B/C/D fields must accept zero values, but negative values are not allowed.
- If **Qualified Income % > 0** and **A+B+C+D = 0**, the calculator must not silently apply IP Box. It should show a warning that the nexus ratio cannot be meaningfully calculated from all-zero qualified-cost inputs.
- A contextual tooltip should explain that A-D should include only costs directly connected to the qualified IP mechanism. Costs not directly related to the qualified IP should not be pushed into the nexus categories.
- The module should display a short compliance note that the calculator provides an **estimate** and assumes the user keeps the legally required separate evidence for IP Box.

## 3. Core Functional Logic
The IP Box mechanism operates as a secondary annual PIT-estimation overlay on top of the standard B2B taxation models. The processing engine should follow this logical flow:

* **Eligibility Gating**
  * If **IP Box Eligibility = Off**, bypass the entire feature.
  * If the selected tax form is **Lump Sum (Ryczałt)**, the feature must be unavailable or automatically disabled with an explanatory message.
  * The mechanism is available only for **Tax Scale** and **Flat Tax**.

* **Qualified IP Income Attribution**
  * The calculator must not treat IP Box as applying directly to gross revenue alone.
  * The engine should estimate the portion of the user’s annual business result attributable to qualified IP based on the **Qualified Income %** input.
  * The recommended estimation sequence is:
    * `Qualified IP Revenue = Total Revenue × Qualified Income %`
    * `Attributed Business Costs = Total Deductible Business Costs × Qualified Income %`
    * `Preliminary Qualified IP Income = Qualified IP Revenue - Attributed Business Costs`
  * This keeps the mechanism aligned with the legal concept that IP Box concerns **income (or loss)** from qualified IP, not just revenue share.

* **Qualified Income-Type Scope**
  * The feature applies only to the portion of income that the user considers to arise from qualified IP categories, such as:
    * license fees or royalties from qualified IP,
    * sale/transfer of qualified IP,
    * qualified IP included in the price of a product or service,
    * damages for infringement of qualified IP rights.
  * The calculator does not independently determine legal eligibility of a contract or invoice line; it estimates the tax effect based on user-provided attribution.

* **Nexus Ratio Calculation**
  * The system calculates the nexus coefficient using the formula:
    * `Nexus = ((a + b) × 1.3) / (a + b + c + d)`
  * Where:
    * `a` = direct own R&D costs related to the qualified IP,
    * `b` = acquisition of related R&D results from unrelated entities,
    * `c` = acquisition of related R&D results from related entities,
    * `d` = acquisition of the qualified IP itself.
  * If the calculated value exceeds `1.0`, it must be capped at `1.0`.
  * If `(a + b + c + d) = 0`, the calculator must not divide by zero. In that case:
    * show a validation warning,
    * set the **qualified income eligible for 5%** to `0` for estimation purposes,
    * preserve the base tax calculation without IP Box benefit.
  * Costs entered in A-D should be interpreted as **actual qualified nexus costs**, not all company expenses.

* **Qualified Income After Nexus**
  * The portion of income eligible for the 5% rate is:
    * `Qualified IP Income After Nexus = max(Preliminary Qualified IP Income, 0) × Nexus`
  * If the preliminary qualified IP result is negative, the module must not calculate a negative 5% tax amount. Instead:
    * display `0` as current-year 5% tax,
    * keep the broader business result handled by the base tax engine,
    * optionally surface an informational note that the IP-related component is currently loss-making.

* **Residual Income Taxation**
  * The remaining business income continues to be taxed according to the selected base PIT regime:
    * `Residual Standard-Taxed Income = Total Taxable Business Income - Qualified IP Income After Nexus`
  * This residual bucket includes:
    * the non-IP portion of income,
    * and any IP-related income that does not pass through the nexus coefficient.

* **Tax Computation**
  * `IP Box Tax = Qualified IP Income After Nexus × 5%`
  * `Standard PIT Tax = PIT according to selected form on Residual Standard-Taxed Income`
  * `Total PIT After IP Box = IP Box Tax + Standard PIT Tax`

* **Annual Settlement Handling**
  * The module must treat IP Box as an **annual reconciliation estimate**, not as a current-month reduction of income-tax advances.
  * During the year, standard PIT advances still follow the selected tax form.
  * Therefore, if the calculator presents monthly views, the UI must clearly distinguish between:
    * **base ongoing monthly tax logic**, and
    * **estimated annual IP Box benefit / refund effect**.

* **Social Security (ZUS) Interaction**
  * IP Box does **not** change social-insurance contribution logic.
  * The module must continue to use ZUS values produced by the core calculator.
  * Social contributions should not be artificially reduced by switching IP Box on.

* **Health Insurance Interaction**
  * Health insurance remains governed by the selected B2B tax regime and the core calculation engine.
  * IP Box affects the preferential PIT treatment of qualified income, but it must not be modeled as a separate health-insurance discount switch.
  * In the UI, this should be explained to prevent the user from assuming that the 5% rate also lowers the health-insurance burden directly.

* **Multi-IP Simplification**
  * From a legal perspective, income and costs should be traceable per qualified IP/right or per product/service grouping where appropriate.
  * In this calculator, the feature may operate on an **aggregated estimate** using one percentage and one A-D cost set, but this must be explicitly disclosed as a simplification.

## 4. Output & Reporting Metrics
The system provides a comparative view to show the financial benefit of the mechanism:

| Output Metric | Description |
| :--- | :--- |
| **Tax Payable (5%)** | Annual PIT amount due on the portion of qualified IP income that remains eligible after applying the nexus ratio. |
| **Effective Tax Rate** | Weighted annual effective tax rate across total business income after applying the split between 5% IP Box taxation and the standard PIT regime. |
| **IP Box Tax Gain** | Difference between annual PIT calculated under the base tax form only and annual PIT calculated with the IP Box mechanism enabled. This should be shown as the estimated annual benefit, not as an automatic monthly saving. |
| **Calculated Nexus Ratio** | Final nexus coefficient used in the calculation, capped at `1.00`. |
| **Qualified IP Income (Before Nexus)** | Estimated annual income attributable to qualified IP before nexus limitation. This helps the user understand the effect of cost attribution separately from the nexus filter. |
| **Qualified IP Income (After Nexus)** | Final annual amount eligible for the 5% IP Box tax rate after applying the nexus ratio. |
| **Residual Standard-Taxed Income** | Annual income remaining subject to the ordinary PIT rules of the selected tax form after extracting the IP Box-qualified portion. |
| **Net Income (IP Box)** | Annual take-home result after ZUS, health insurance, and PIT, including the estimated year-end IP Box effect. If monthly figures are shown elsewhere in the calculator, the UI must explain that this metric includes annual reconciliation logic. |
| **Compliance / Estimation Warning** | Informational output stating that the result is an estimate dependent on correct qualification of income, separate accounting records, and real annual tax-return reconciliation. |

## 5. Business Rules & Constraints
* **Statutory Rate:** The IP Box rate is fixed at **5%** for qualified income from qualified IP.
* **PIT Context in This Calculator:** Although the legal mechanism exists in both PIT and CIT, this B2B calculator should implement the feature functionally in the **PIT entrepreneur context**.
* **Tax Form Compatibility:** The IP Box mechanism is applicable only to **Tax Scale** and **Flat Tax**. It is functionally incompatible with **Lump Sum (Ryczałt)** in this calculator.
* **Annual Settlement Rule:** IP Box must be presented as an **annual tax-return mechanism**. The calculator must not imply that the user may lawfully apply the 5% rate to current-year monthly advance payments.
* **Qualified Right Requirement:** The mechanism applies only to income from **qualified intellectual property rights** protected by law. In the B2B software-developer context, this commonly means **copyright in computer software**, but the calculator must not assume every IT invoice automatically qualifies.
* **R&D Requirement:** The user must be understood as creating, developing, or improving qualified IP within R&D activity. The calculator may estimate the benefit, but it does not replace legal/tax verification of this condition.
* **Qualified Income Requirement:** The mechanism applies only to income categories recognized under IP Box rules. The **Qualified Income %** field must therefore be interpreted as the share of business income connected to those categories.
* **Nexus Multiplier:** Category A and B costs are uplifted in the nexus formula by a multiplier of **1.3**.
* **Nexus Cap:** If the nexus formula returns a value above `1.0`, the system must use `1.0`.
* **Zero-Denominator Protection:** If `a+b+c+d = 0`, the module must not calculate IP Box benefit and must show a clear validation message.
* **Qualified-Cost Scope:** The A-D nexus categories should contain only costs directly connected to the qualified IP mechanism. Costs not directly related to the qualified IP should not be included.
* **Negative Qualified Result:** A negative qualified IP result must not generate a negative 5% tax. The module should show no IP Box benefit for the current estimate and retain the broader business outcome in the base engine.
* **Record-Keeping Requirement:** The calculator assumes that the user maintains separate accounting evidence enabling identification of revenues, costs, and income related to qualified IP. Without such records, the estimate may not be practically usable for annual settlement.
* **Protection Period Constraint:** The preferential treatment should be understood as available only for income connected to a qualified IP right during its legal protection period.
* **Aggregation Disclaimer:** Where the calculator uses one global percentage and one global A-D set, it must disclose that the result is a simplified aggregate estimate and may differ from a detailed per-IP statutory calculation.
* **No Minimum Income Threshold:** There is no dedicated minimum-income threshold for turning the feature on; however, absence of qualified income or absence of valid nexus inputs should produce no effective IP Box benefit.

## Expert Recommendations & Edge Cases
1. **Correct the nexus formula in the specification and implementation** from `1.1` to `1.3`. This is a material logic correction, not a cosmetic one.
2. **Rename or clarify the “Qualified Income %” field** in the UI tooltip so users understand it is the share of income attributable to qualified IP, not a general “tax optimization” percentage.
3. **Do not model IP Box as an instant monthly net-salary boost.** The UI should explicitly distinguish:
   - ongoing monthly taxation under the selected form,
   - estimated year-end IP Box benefit.
4. **Add a blocking validation for all-zero A-D cost inputs** whenever IP Box is enabled and the user expects a benefit.
5. **Expose two intermediate values in the result panel**:
   - Qualified IP Income Before Nexus,
   - Qualified IP Income After Nexus.  
   This greatly improves transparency and makes the mechanism understandable to advanced users.
6. **Add a compliance warning when Qualified Income % is high but A/B costs are low or zero.** This is a common indicator of unrealistic input assumptions.
7. **If the user selects Lump Sum (Ryczałt), auto-disable IP Box** and explain why, instead of allowing inconsistent states.
8. **Add a concise note about legal qualification risk**: software-development income often qualifies only where there is real creation/development/improvement of protected software IP and a defensible method of income attribution.
9. **Show an informational warning for multi-project or multi-contract users** that one global percentage is only a simplified estimate and that real annual settlement may require project-level allocation.
10. **Do not include unrelated costs in nexus guidance.** Tooltips should explicitly discourage using financing costs or other non-IP-direct expenses as A-D inputs.
11. **If Preliminary Qualified IP Income is negative**, show:
   - `Qualified IP Income After Nexus = 0`,
   - `IP Box Tax Payable (5%) = 0`,
   - an informational note that the IP-related component is currently loss-making.
12. **Keep the feature narrowly scoped.** Do not merge IP Box logic with unrelated reliefs, spouse taxation, holiday savings, VAT, or other modules. The only cross-module dependency should be reading the base B2B income/tax data required to estimate the IP Box effect correctly.