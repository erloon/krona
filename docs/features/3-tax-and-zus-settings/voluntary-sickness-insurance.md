# Functional Specification: Voluntary Sickness Insurance

## 1. Executive Summary
The "Voluntary Sickness Insurance" (Dobrowolne ubezpieczenie chorobowe) feature within the B2B calculator allows eligible sole proprietors (B2B contractors / JDG) to simulate the monthly financial impact of opting into the Polish statutory sickness insurance fund. Because sickness insurance is optional for entrepreneurs who are otherwise subject to social insurance, this module must calculate the additional ZUS social contribution based on the active ZUS status, include it in the social contribution breakdown, and propagate its downstream impact into tax, health-insurance, and final net-income calculations where applicable.

This feature is strictly a **monthly contribution simulation**. Its primary purpose is to show the cost effect of enabling voluntary sickness insurance inside the calculator. It must not imply automatic entitlement to benefits, automatic qualification for sick pay, or simulation of actual ZUS benefit payouts.

## 2. Input & Configuration Parameters
| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| Voluntary Sickness Insurance (Dobrowolne ubezpieczenie chorobowe) | `Yes` (Checked) / `No` (Unchecked) | If enabled and legally allowed for the selected ZUS status, the calculator adds the sickness insurance premium to Social ZUS using the statutory 2.45% rate. |
| ZUS Social Insurance Status *(context dependency)* | `Brak ulgi` / `Standard ZUS`, `Składka preferencyjna`, `Ulga na start`, `Umowa o pracę` | Determines whether the voluntary sickness insurance option is legally available and which statutory contribution base is used. |
| Contribution Base *(system-derived, non-editable in this feature)* | Derived from the selected ZUS status | Serves as the calculation base for the sickness premium. This feature must not allow direct manual override of the sickness rate or manual entry of the sickness premium amount. |
| Tax Form *(downstream dependency)* | `Skala podatkowa`, `Podatek liniowy 19%`, `Ryczałt` | Determines how the paid sickness premium influences downstream tax and health-insurance calculations through the shared social-contribution payload. |

## 3. Core Functional Logic
* **Eligibility Gate Based on ZUS Status:**  
  The calculator must first verify whether voluntary sickness insurance is legally available for the active social-insurance status.
  * *Standard ZUS / Brak ulgi:* option is available.
  * *Preferential ZUS / Składka preferencyjna:* option is available.
  * *Ulga na start:* option is not available, because social insurance contributions are not paid during this relief period.
  * *Umowa o pracę:* option must be unavailable or forced to 0 PLN in the B2B calculator context if the selected status means that social ZUS for the business activity is not being calculated.

* **Base Assessment:**  
  The calculator derives the statutory sickness-insurance base from the selected ZUS status:
  * *Standard ZUS / Brak ulgi:* base equals the statutory standard social-insurance base for the active year, typically not lower than 60% of the forecast average monthly wage.
  * *Preferential ZUS / Składka preferencyjna:* base equals the statutory preferential base for the active year, typically not lower than 30% of the minimum wage.
  * *Ulga na start / Umowa o pracę:* effective base for this feature is 0 PLN.

* **Minimum-Base Assumption:**  
  Unless another dedicated module explicitly supports custom declaration of a higher ZUS base, this feature must assume the **minimum statutory base** applicable to the chosen ZUS status. It must not simulate a voluntarily increased base for sickness insurance.

* **Premium Calculation:**  
  The sickness insurance premium is calculated as:

  `Sickness Premium = Active Social Contribution Base × 2.45%`

  The result must be rounded to 2 decimal places (PLN grosz precision) before presentation and before aggregation into the social-contribution total.

* **Aggregation with Social ZUS:**  
  When enabled, the calculated sickness premium is added to the social ZUS package together with:
  * retirement insurance (emerytalne),
  * disability insurance (rentowe),
  * accident insurance (wypadkowe).

  This feature must **not** independently modify Fundusz Pracy / Fundusz Solidarnościowy eligibility. Enabling sickness insurance only adds the sickness line item; it does not change the legal rules for other components.

* **Downstream Tax Engine Impact:**  
  The paid sickness premium must be passed to the tax engine as part of the paid social-insurance contribution set.
  * For *tax scale* and *linear tax*, it must reduce the relevant taxable income according to the calculator’s tax-treatment rules for paid social contributions, provided it is not already recognized elsewhere.
  * For *lump sum / ryczałt*, it must be handled consistently with the calculator’s rules for paid social contributions that reduce the relevant revenue base.

* **Downstream Health-Insurance Impact:**  
  The sickness premium does **not** introduce a separate health-insurance rate or separate health-insurance toggle. However, because it forms part of paid social contributions, it may indirectly affect the health-insurance calculation base in scenarios where the selected tax form legally allows paid social contributions to reduce the relevant income or revenue figure.  
  Therefore, this feature must pass the paid sickness premium into the shared calculation pipeline and must not be treated as isolated from health-insurance logic.

* **Net Income Recalculation:**  
  The final take-home result (na rękę) must be recalculated immediately after the sickness premium is included or removed. In most scenarios, enabling the option decreases final net income, although the exact net effect depends on the selected tax form and the downstream deductibility of social contributions.

## 4. Output & Reporting Metrics
| Output Metric | Description |
| :--- | :--- |
| Sickness Insurance Premium (Składka chorobowa) | The exact monthly value of the sickness insurance contribution calculated from the active ZUS base and displayed as a separate line item in the ZUS breakdown. |
| Total Social Security Contributions (Suma ZUS) | The updated sum of social contributions after including or excluding the sickness premium. |
| Adjusted Tax Base (Podstawa opodatkowania) | The recalculated taxable base after the sickness premium is included in the paid social-contribution payload, where relevant for the selected tax form. |
| Adjusted Health Insurance Calculation Input *(indirect effect)* | The recalculated income/revenue input passed to the health-insurance engine where paid social contributions influence the health-insurance base under the selected tax regime. |
| Net Income (Na rękę) | The final take-home amount after all recalculations caused by enabling or disabling the sickness premium. |

## 5. Business Rules & Constraints
* **Legal Availability Rule:**  
  Voluntary sickness insurance may only be calculated when the user is in a ZUS status that actually permits social-insurance contributions for the business activity. If the selected status does not permit it, the effective sickness premium must be 0 PLN.

* **Ulga na Start Exclusion:**  
  If the user selects `Ulga na start`, the Voluntary Sickness Insurance option must be disabled, hidden, or ignored in calculation logic. The system must not allow a non-zero sickness premium during this period.

* **Employment-Based Exclusion:**  
  If the user selects `Umowa o pracę` and the calculator’s business logic treats this state as no B2B social ZUS being due, the sickness option must also be disabled, hidden, or forced to 0 PLN.

* **Statutory Rate Fixation:**  
  The sickness-insurance rate is fixed by law at **2.45%** of the applicable base. The user cannot edit this rate and cannot manually input the sickness premium amount.

* **No Manual Higher-Base Modeling in This Feature:**  
  This feature must not independently support declaration of a higher voluntary social-insurance base. If the calculator does not expose higher-base configuration elsewhere, the sickness premium must always be derived from the statutory minimum base for the selected ZUS status.

* **Rounding Consistency:**  
  The sickness premium must be rounded consistently to 2 decimal places before display and before the value is included in the total social ZUS calculation, to avoid reconciliation differences between the line item and total result.

* **No Double Deduction Rule:**  
  The sickness premium must not reduce tax base, health base, or final net result more than once. It should enter downstream engines through the same shared social-contribution payload used for the other social ZUS components.

* **Monthly Scope Only:**  
  This module calculates the monthly premium effect only. It does not simulate:
  * the actual right to receive sickness benefit,
  * the amount of a future benefit,
  * the 90-day waiting-period eligibility date,
  * historical continuity of insurance,
  * arrears, debt, or ZUS settlement corrections.

* **No Partial-Month Proration:**  
  The feature assumes a full monthly contribution cycle. It does not support prorated sickness-insurance calculation for partial-month activity, mid-month registration, suspension, or resumption.

* **Dynamic Year Parameters:**  
  The contribution base used by this feature must come from current-year statutory parameters used elsewhere in the ZUS engine. The sickness-insurance formula must therefore automatically reflect annual legal changes to the underlying ZUS base.

## Expert Recommendations & Edge Cases
1. **Add explicit dependency on `Umowa o pracę`, not only `Ulga na start`.**  
   The original specification correctly excluded `Ulga na start`, but it should also explicitly handle employment-based scenarios where the calculator sets B2B social ZUS to zero. In such cases, the sickness toggle should not remain functionally active.

2. **Correct the health-insurance interaction.**  
   The original text overstated that sickness insurance does not affect health-insurance calculations. The more accurate product rule is: it does not create a separate health-insurance rule by itself, but as a paid social contribution it may indirectly affect the health-insurance base where the selected tax-regime logic uses paid social contributions in that base.

3. **Introduce a clear informational tooltip.**  
   The UI should explain that enabling this option only adds the monthly contribution and does **not** mean immediate right to sick-pay benefits. A short note should state that voluntary sickness insurance is tied to separate ZUS entitlement rules, including a waiting period and continuity requirements.

4. **Clarify that the calculator assumes the statutory minimum base.**  
   This is important because in real life a higher declared base changes both contribution cost and potential future benefit amounts. If the app does not model higher declared bases, the specification should say so explicitly to avoid misleading users.

5. **Handle state transitions cleanly.**  
   If the user turns sickness insurance on and then changes ZUS status to an ineligible one, the effective calculated value must become 0 PLN immediately. From a UX perspective, the interface may either:
   * auto-uncheck the toggle, or
   * visually disable it while preserving the previous user intent in session state for restoration if the user returns to an eligible status.

6. **Keep the line item visible when helpful for transparency.**  
   Even when the effective value becomes 0 PLN due to ineligibility, showing the line item as disabled with a short explanation can improve trust and reduce confusion.

7. **Do not imply benefit simulation.**  
   The feature should not suggest that it calculates L4 entitlement, sickness benefit amount, or claim success. It is strictly a contribution-cost feature.

8. **Document post-2022 payment nuance as informational only.**  
   From a business-rules perspective, the calculator should not attempt to simulate arrears or benefit-blocking logic. However, the help text may note that payment timeliness and contribution continuity still matter for benefits, even though this monthly calculator does not model those administrative scenarios.