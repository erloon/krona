# Functional Specification: Unpaid Holiday Mechanism (Urlop Bezpłatny)

## 1. Executive Summary
The Unpaid Holiday Mechanism is a simulation component within the B2B calculator designed to model the financial effect of planned non-billable time in a Polish sole proprietorship / B2B scenario. Its purpose is to reflect the practical rule of "no work, no pay" typical for time-based B2B arrangements, where the contractor often does not receive statutory paid leave comparable to an employment contract.

This mechanism must reduce revenue, not create an artificial expense. It should show how unpaid absence decreases annual and monthly profitability while fixed obligations of an active business remain in force, especially ZUS, health insurance, taxes, and recurring business costs.

This mechanism applies only to an **active business** and must remain separate from:
- **business suspension (zawieszenie działalności)**,
- **sick leave / voluntary sickness insurance logic**,
- any other reliefs or tax preferences not directly caused by unpaid absence.

The feature should support both annual profitability analysis and month-by-month cash flow simulation, while keeping calculations consistent with the selected taxation form and the selected billing model.

## 2. Input & Configuration Parameters
| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| Days of Unpaid Holiday | Integer, 0 to maximum available billable working days in selected scope | Reduces the number of billable working days and therefore lowers revenue. |
| Calculation Year | Inherited from the main calculator year context | Determines the working calendar, including weekends and Polish public holidays for the selected year. |
| Daily Rate / Monthly Rate | Numeric (PLN) | Defines the commercial base used to calculate lost revenue during unpaid leave. |
| Billing Basis | Daily rate / Monthly rate with explicit proration rule | Determines how unpaid days are translated into lost revenue. For monthly-rate scenarios, a clear day-proration rule is required. |
| Month Selection | Annual only / specific months (Jan-Dec) | Allocates unpaid days to chosen months to simulate monthly cash-flow impact and timing of tax / health insurance effects. |
| Distribution Method | Manual month allocation / proportional distribution | Controls whether the user assigns holiday days directly to months or the system spreads them across the year. |
| Inclusion in Annual View | Toggle (Yes/No) | Determines whether the feature affects only annual summary, or both annual and monthly views. |
| Non-working Day Validation | Automatic, always enabled | Prevents counting weekends and statutory public holidays as unpaid holiday days. |
| Approximation Warning for Monthly Contracts | System flag | If the contract uses a fixed monthly retainer and the calculator cannot identify a contractual proration rule, the feature must warn that the result is an approximation. |

## 3. Core Functional Logic
The mechanism operates as a **revenue-reduction engine**. It must not treat unpaid holiday as a deductible cost category. The logic is integrated into the primary B2B calculation stream as follows:

* **Calendar Baseline Calculation:**
    * The system calculates **Standard Billable Days** for the selected year using the Polish working calendar.
    * Standard Billable Days must exclude:
        * weekends,
        * Polish statutory public holidays,
        * public holidays that fall on already non-billable days must not be subtracted twice.
    * If monthly allocation is used, the system must also calculate **Billable Days per Month** using the same rules.

* **Holiday Validation & Allocation:**
    * The entered **Unpaid Holiday Days** must be validated against the available billable days.
    * The annual total cannot exceed `Standard Billable Days`.
    * If month allocation is enabled, the number of unpaid days assigned to a month cannot exceed that month’s remaining billable days.
    * Days falling on weekends or public holidays must be rejected or auto-excluded from the deduction logic.
    * The annual total of allocated monthly days must equal the total unpaid holiday days.

* **Revenue Adjustment:**
    * The mechanism must reduce revenue only through lost billable capacity.
    * Core formula:
        * `Active Working Days = Standard Billable Days - Validated Unpaid Holiday Days`
        * `Lost Gross Revenue = Validated Unpaid Holiday Days × Effective Daily Billing Rate`
        * `Adjusted Annual Gross Revenue = Baseline Annual Gross Revenue - Lost Gross Revenue`
    * For **daily-rate contracts**:
        * `Effective Daily Billing Rate = Daily Rate`
    * For **monthly-rate contracts**:
        * the system must use an explicit contractual proration rule, for example:
            * `Monthly Rate / Billable Working Days of Given Month`, or
            * another clearly defined normalization method already used by the calculator.
        * If such a rule is not explicitly defined in the product, the UI must display an approximation warning instead of implying exact legal/accounting precision.
    * If month allocation is enabled:
        * revenue reduction must be applied in the specific months where the unpaid days occur,
        * annual revenue loss must equal the sum of all monthly revenue losses.

* **Fixed Cost Decoupling:**
    * Unpaid holiday does **not** suspend the business.
    * Therefore, during unpaid holiday months, the engine continues to apply recurring business burdens relevant to an active business, including:
        * social insurance contributions where applicable,
        * health insurance contribution,
        * recurring fixed business costs already configured elsewhere in the calculator.
    * The mechanism must explicitly show that a month with low or zero revenue may still generate negative net cash flow.

* **Tax Base Recalculation:**
    * For **Tax Scale (Skala Podatkowa)** and **Flat Tax (Podatek Liniowy)**:
        * reduced revenue lowers the income base,
        * tax advances must be recalculated after holiday-related revenue reduction,
        * monthly income tax cannot fall below zero,
        * if the business remains active, health-insurance minimum rules must still be respected for the applicable contribution period.
    * For **Lump Sum (Ryczałt)**:
        * tax is due only on revenue actually generated,
        * reduced revenue may move the user below an annual health-insurance threshold or delay crossing a threshold later in the year,
        * the mechanism must recalculate threshold position dynamically using cumulative annual revenue after unpaid holiday adjustment.
    * The engine must preserve annual consistency:
        * annual tax result must reconcile with the sum of monthly effects where monthly allocation is used,
        * monthly presentation is a cash-flow view; annual totals remain the authoritative result for year-end comparison.

* **Negative / Zero-Revenue Month Handling:**
    * If unpaid holiday reduces revenue for a month to zero:
        * the system must show zero revenue for that month,
        * income tax for that month must not become negative,
        * fixed burdens may still create a negative monthly net result.
    * The UI must not suppress or flatten negative monthly values, because they are essential to understanding B2B leave economics.

* **Effective Rate Calculation:**
    * The feature must calculate the **Real Daily Rate** as the contractor’s economically effective net return after the cost of unpaid leave is included.
    * Recommended formula:
        * `Real Daily Rate = Total Annual Net Profit / Active Working Days`
    * This value should be lower than the nominal billing rate and should communicate the true profitability of each actually worked day after absorbing unpaid leave and fixed obligations.

* **Reserve / Buffer Interpretation:**
    * If the product presents the feature to the user in savings-oriented language (for example “set aside for holiday”), the savings presentation must remain a derived informational view.
    * The primary calculation engine must still be based on lost billable revenue, not on treating holiday as an accounting expense.

## 4. Output & Reporting Metrics
| Output Metric | Description |
| :--- | :--- |
| Adjusted Monthly Net | Estimated take-home pay for the month(s) where holiday is taken, after recalculating revenue, tax, health insurance, ZUS, and configured fixed costs. |
| Total Annual Opportunity Cost | Total gross revenue lost because the contractor is unavailable for billable work during the unpaid holiday period. |
| Real Daily Rate | Net annual profitability per actually worked day after factoring in the cost of unpaid leave and maintaining the business during leave. |
| Break-even Buffer | Additional monthly or annual revenue reserve needed to keep target net income stable despite unpaid holiday. This is an informational output, not a tax cost. |
| Holiday-Affected Months | Months in which unpaid holiday materially changes monthly net outcome, useful for identifying cash-flow risk periods. |
| Zero / Negative Net Warning | Explicit indicator shown when a month produces zero revenue or a negative monthly net due to fixed obligations. |

## 5. Business Rules & Constraints
* **Scope Rule:** This mechanism applies only to unpaid absence while the business remains active. It must not simulate CEIDG suspension, liquidation, or interruption of insurance titles.
* **ZUS Constancy Rule:** The system must not automatically reduce ZUS contributions merely because unpaid holiday is entered. Reduction of obligations requires separate business-status logic and is out of scope for this feature.
* **Working-Day Capacity Rule:** Unpaid holiday days can only consume valid billable working days. The engine must prevent entering more days than the available calendar capacity.
* **Monthly Capacity Rule:** When holiday is allocated to a month, the allocated value cannot exceed that month’s billable working days after excluding weekends and public holidays.
* **Public Holiday Overlap Rule:** The mechanism must validate against Polish statutory public holidays for the selected year to avoid double-counting lost days.
* **Weekend Overlap Rule:** Weekend days must never be counted as unpaid holiday loss days in the revenue engine.
* **Year-Aware Calendar Rule:** The mechanism must use the holiday calendar applicable to the selected year, including movable holidays and newly introduced statutory non-working days where legally effective for that year.
* **Tax Non-Negativity Rule:** Monthly tax values caused by holiday-related revenue reduction must be floored at zero and must never create negative tax.
* **Health Insurance Minimum Rule:** For active-business scenarios under tax forms where minimum health-insurance rules apply, the mechanism must not assume that zero revenue automatically means zero health contribution.
* **Health Insurance Tiers (Ryczałt):** If the user is on Lump Sum (Ryczałt), the mechanism must trigger a warning when unpaid holiday changes the annual revenue tier logic, especially around the 60,000 PLN and 300,000 PLN thresholds.
* **Threshold Timing Rule:** In ryczałt mode, the month in which a threshold is crossed matters. Month allocation must therefore affect not only annual totals, but also the timing of monthly health-insurance burden.
* **Negative Income Scenario:** If unpaid holiday in a given month leads to zero revenue while fixed obligations remain payable, the system must show a negative monthly net result instead of forcing the value to zero.
* **Retainer Approximation Rule:** If the selected remuneration model is a fixed monthly retainer not contractually reduced by leave, the feature must either:
    * be disabled for that scenario, or
    * clearly mark the result as an approximation based on an assumed daily proration rule.
* **Consistency Rule:** The annual revenue loss must always equal the sum of the monthly revenue losses when monthly allocation is used.
* **Precision & Rounding Rule:** Internal calculations should use higher precision, while displayed monetary values should be rounded consistently to 2 decimal places. Rounded monthly values must still reconcile acceptably with annual totals.
* **Sick Leave Distinction:** This mechanism must remain fully separate from sick-leave logic involving voluntary sickness insurance, waiting periods, or benefit payments from ZUS.

## Expert Recommendations & Edge Cases
1. **Clarify the product meaning in UI text.** The live calculator appears to expose a holiday-related option using savings-oriented wording. The specification should explicitly distinguish:
   * **unpaid holiday simulation** = lost revenue due to non-billable days,
   * **holiday reserve suggestion** = how much cash to set aside to smooth income.
   These are related, but not the same calculation.

2. **Use a year-specific Polish working calendar.** This is essential because unpaid holiday logic depends on actual billable days, not a generic “260 working days” approximation. Movable holidays and newly effective statutory non-working days must be reflected automatically.

3. **Do not assume every monthly B2B contract behaves like a day-rate contract.** Many B2B agreements are fixed-fee retainers. The product should either require a defined proration rule or disclose that the result is an approximation.

4. **Highlight cash-flow risk, not only annual loss.** A user often cares less about annual opportunity cost and more about whether August or December becomes cash-flow negative. The monthly output should make this immediately visible.

5. **Warn around ryczałt health-insurance thresholds.** This is one of the most important real-world consequences of unpaid holiday for Polish B2B users, because a relatively small change in annual revenue can materially change the health-insurance burden.

6. **Recommended test scenarios:**
   * 0 unpaid days -> no impact anywhere.
   * 26 unpaid days distributed across months -> annual revenue reduced, monthly cash flow changes.
   * Holiday entered entirely in one month with fixed costs enabled -> zero-revenue / negative-net scenario.
   * Holiday placed on a month full of public holidays and weekends -> validation prevents over-allocation.
   * Ryczałt user close to 60,000 PLN annual revenue -> threshold warning triggers correctly.
   * Monthly retainer contract without explicit proration rule -> approximation warning shown.
   * Holiday entered in December of a year with additional statutory non-working day(s) -> working-day denominator recalculates correctly.

7. **Keep the scope strict.** Do not merge this feature with sick leave, maternity, business suspension, or tax-relief logic. Those may influence similar outputs, but they are separate business mechanisms and should remain isolated in both UX and calculation logic. 