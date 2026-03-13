# Functional Specification: Return Relief Logic (Ulga na powrót)

## 1. Executive Summary
The "Return Relief" (Ulga na powrót) logic is a specialized tax calculation module within the B2B calculator designed to model the financial impact of the Polish statutory PIT exemption available to eligible taxpayers who transfer their tax residence to Poland. Publicly, the calculator already advertises both **Ulga na powrót (do 85 528 zł/rok)** and **IP BOX**, so this specification must define the interaction precisely for B2B scenarios. 0

Its core business value is to provide accurate net income forecasting for entrepreneurs relocating their tax residency to Poland. The key legal correction is that the relief applies to qualifying **revenue/przychody**, not simply to taxable **income/dochod**. It covers qualifying business revenue taxed under **Tax Scale**, **Flat Tax**, **IP Box 5%**, and **Lump Sum (Ryczałt)**, up to **85,528 PLN per tax year**, within a four-year eligibility window selected by the taxpayer. 1

Therefore, the module must not be modeled as a simple “PIT = 0 until cumulative income reaches 85,528 PLN” engine. Instead, it must track the annual **qualifying revenue limit**, apply it chronologically from the beginning of the tax year, and only then calculate PIT on the non-exempt portion according to the selected taxation form. Final annual settlement remains the legal source of truth, while the calculator provides a monthly forecast view. 2

## 2. Input & Configuration Parameters

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **Return Relief Toggle** | `Yes` / `No` (Boolean) | Activates or deactivates the application of the annual PIT exemption for qualifying revenue under Ulga na powrót. |
| **Relief Start Year** | `Year of relocation to Poland` / `Next tax year` | Determines the first year of the statutory 4-year relief window. This is mandatory because the taxpayer may choose whether the 4-year period starts in the relocation year or from the beginning of the following year. 3 |
| **Form of Taxation** | `Tax Scale` (Zasady ogólne), `Flat Tax` (Podatek liniowy), `Lump Sum` (Ryczałt) | Determines how PIT is calculated on the portion of revenue not covered by the relief. If the application separately supports **IP Box**, the Return Relief must remain compatible with that overlay because the official scope of the relief includes business income taxed at 5% IP Box. 4 |
| **Monthly Revenue** | Numeric value (PLN) | This is the primary qualifying business revenue tracked against the annual **85,528 PLN** limit. For this feature, revenue is the limit-consumption driver. |
| **Monthly Operating Costs** | Numeric value (PLN) | Affects the PIT base for `Tax Scale`, `Flat Tax`, and `IP Box` forecasting, but does **not** determine how quickly the statutory Return Relief limit is consumed, because the relief is revenue-based, not income-based. 5 |
| **ZUS (Social Security) Status** | `Full`, `Preferential`, `Relief to Start`, `None` | Affects the normal PIT base calculation under the chosen taxation form, but does **not** change the annual 85,528 PLN relief cap itself. |
| **Other PIT-0 Revenue Already Used in the Same Tax Year** | Numeric value `0–85,528 PLN` | Reduces the remaining annual Return Relief limit available inside the B2B calculator when the taxpayer also uses other PIT-0 reliefs (e.g. Youth Relief, Senior Relief, 4+ Family Relief) or qualifying income from outside this calculator. The 85,528 PLN limit is shared across these reliefs. 6 |

## 3. Core Functional Logic
The processing engine for Return Relief must operate as a cumulative, month-by-month state machine, but the tracked threshold must be based on **qualifying annual revenue**, not cumulative taxable income. The relief is applied chronologically from the beginning of the year. 7

* **Step 0: Eligibility Gate & Annual Limit Initialization**
    * The calculator should treat Return Relief as available only for users who satisfy the statutory conditions, including relocation of tax residence to Poland after 31 December 2021, no Polish tax residence during the required pre-relocation period, possession of the required citizenship/residency basis, and documentary evidence confirming foreign tax residence. The calculator may simplify this into a user-controlled eligibility assumption, but the logic must not silently assume universal eligibility. 8
    * The annual limit is initialized as:  
      `Available Return Relief Limit = 85,528 PLN - Other PIT-0 Revenue Already Used in the Same Tax Year`
    * If the result is `< 0`, it must be clamped to `0.00 PLN`. The system must never allow this feature to exempt more than the remaining shared PIT-0 limit. 9

* **Step 1: Qualifying Revenue Determination**
    * The engine must identify the portion of monthly business revenue that is legally eligible for Ulga na powrót.
    * For B2B purposes, the feature applies to revenue from sole proprietorship activity taxed by:
        * **Tax Scale**
        * **Flat Tax 19%**
        * **IP Box 5%**
        * **Lump Sum / Ryczałt** 10
    * The engine must explicitly treat the annual relief limit as **revenue-based**:
      `QualifyingRevenueMonth = max(0, RevenueMonthEligibleForReturnRelief)`
    * `Monthly Operating Costs` must **not** reduce `QualifyingRevenueMonth`.
    * Months with high costs, low profitability, or even zero/negative tax base may still consume the annual Return Relief limit if qualifying revenue was earned in that month. This is a critical correction versus the original specification. 11

* **Step 2: Monthly Base Calculation Before Applying Return Relief**
    * The module should reuse the standard tax engine for the selected taxation form, but isolate the part relevant to PIT forecasting:
    * For **Tax Scale / Flat Tax / IP Box**:
      `IncomeBaseMonth = max(0, RevenueMonth - DeductibleCostsMonth - SocialContributionsDeductibleUnderSelectedForm)`
    * For **Lump Sum**:
      the module must reuse the standard ryczałt engine because on ryczałt the taxable base is revenue-based and costs do not reduce the taxable amount. 12
    * Health insurance must remain outside Return Relief logic and continue to be calculated by the standard taxation-form engine.

* **Step 3: Cumulative Revenue Tracking & Chronological Relief Consumption**
    * The engine maintains:
      * `YTDQualifyingRevenue`
      * `YTDExemptRevenue`
      * `RemainingReturnReliefLimit`
    * For each month:
      * `ExemptRevenueMonth = min(RemainingReturnReliefLimit, QualifyingRevenueMonth)`
      * `TaxableRevenueMonth = QualifyingRevenueMonth - ExemptRevenueMonth`
      * `RemainingReturnReliefLimit = RemainingReturnReliefLimit - ExemptRevenueMonth`
    * Relief must be applied in chronological order from the start of the calendar year. The system must never exempt later revenue before earlier revenue. 13

* **Step 4: Mapping Revenue Exemption to PIT Forecasting**
    * Because the legal relief is expressed as an exemption of qualifying revenue, while `Tax Scale`, `Flat Tax`, and `IP Box` ultimately tax income, the calculator should apply a forecasting allocation layer:
      * if `QualifyingRevenueMonth > 0`, then  
        `TaxableRatioMonth = TaxableRevenueMonth / QualifyingRevenueMonth`
      * `TaxableIncomeAfterReturnReliefMonth = IncomeBaseMonth * TaxableRatioMonth`
    * This ensures that when only part of a month’s revenue exceeds the annual cap, only the proportionate part of that month’s income base becomes taxable in the monthly forecast.
    * If `QualifyingRevenueMonth = 0`, then `TaxableIncomeAfterReturnReliefMonth = 0`.
    * This proportional allocation is a calculator forecasting rule intended to support monthly simulation; final annual settlement remains authoritative.

* **Step 5: Threshold Breach Month**
    * In the month where the cumulative qualifying revenue crosses the remaining annual Return Relief limit:
        * the qualifying revenue up to the limit is exempt,
        * the excess portion becomes taxable under the selected form,
        * outputs must clearly show that the month is partially exempt and partially taxed.
    * The system must not round in a way that allows more than `85,528.00 PLN` of annual exempt revenue.

* **Step 6: Tax Form Interaction After Return Relief**
    * **Tax Scale**
        * After the Return Relief allocation is completed, the remaining taxable income continues through the standard tax-scale engine.
        * The general annual tax-free amount of **30,000 PLN** still belongs to the tax-scale regime, but it is **not** a second Return Relief limit. The calculator must therefore apply it through the standard scale-tax algorithm, not by hardcoding a universal gross threshold. Officially, the tax-scale regime uses a 30,000 PLN tax-free amount, and in practice taxpayers exceeding the PIT-0 limit still use that mechanism on the taxable portion. 14
    * **Flat Tax**
        * No tax-free amount is applied. Tax is calculated on `TaxableIncomeAfterReturnReliefMonth` using the flat-tax engine.
    * **IP Box**
        * If the app supports IP Box as a separate overlay, Return Relief must be applied first to qualifying revenue, and only the non-exempt qualified portion may receive the 5% IP Box rate. Official guidance includes IP Box income in the scope of Ulga na powrót. 15
    * **Lump Sum / Ryczałt**
        * Ryczałt is calculated only on `TaxableRevenueMonth` according to the standard rate logic for the configured activity type.
        * Costs must not be considered in this branch. 16

* **Step 7: Health Insurance Contribution (Składka Zdrowotna) Isolation**
    * The logic must explicitly isolate health-insurance calculations from Return Relief.
    * Return Relief changes only the PIT component. It must not reduce or waive health-insurance obligations generated by the selected taxation form.
    * Therefore, the net-income increase from this feature comes only from reduced PIT, not from reduced health contributions.

* **Step 8: Annual Settlement Priority**
    * The calculator is a monthly forecasting tool, but Ulga na powrót is legally settled on an annual basis and may also be applied during the year by excluding qualifying revenue from advance-tax calculations. 17
    * The UI should therefore treat monthly results as an estimate consistent with annual logic, not as a substitute for the year-end tax return.

## 4. Output & Reporting Metrics

| Output Metric | Description |
| :--- | :--- |
| **Monthly Income Tax (PIT)** | Displays the PIT due after applying Return Relief to the month’s qualifying revenue and then routing the remaining taxable portion through the selected taxation-form engine. |
| **Monthly Exempt Revenue (Return Relief)** | Shows how much of the current month’s qualifying revenue was exempted under Ulga na powrót. This is the most important operational metric for explaining threshold consumption. |
| **Year-to-Date Exempt Revenue** | Cumulative amount of qualifying revenue already covered by Return Relief in the current tax year. Must never exceed `85,528 PLN` minus externally used shared PIT-0 limit. 18 |
| **Remaining Return Relief Limit** | Shows the unused portion of the annual shared PIT-0 limit still available to the taxpayer inside this calculation year. |
| **Threshold Breach Indicator** | Flags the exact month in which the annual Return Relief limit was exhausted, including partial-month treatment where relevant. |
| **Year-to-Date (YTD) Income Tax** | The cumulative sum of PIT paid after relief. This will remain lower than the same scenario with Return Relief disabled. |
| **Net Income (Netto)** | The final take-home value after standard ZUS and health insurance, with PIT reduced only to the extent allowed by Return Relief. |
| **Effective Tax Rate** | A blended indicator showing the annual PIT burden after applying Return Relief relative to annual business results. |
| **Annual Warning / Assumption Note** | Displays whether the result assumes the user is within the statutory 4-year window and whether part of the annual shared PIT-0 limit was declared as already used elsewhere. |

## 5. Business Rules & Constraints
* **Relief Applies to Revenue, Not Income:** The statutory limit for Ulga na powrót is based on qualifying **revenue/przychody**, not taxable income. The calculator must therefore consume the annual limit from qualifying revenue, even when operating costs materially reduce the monthly tax base. 19
* **Absolute Annual Limit:** The annual exempt amount is strictly limited to `85,528 PLN`. The system must not exempt any amount above this threshold in a single tax year. 20
* **Shared PIT-0 Limit:** The `85,528 PLN` annual cap is shared with other PIT-0 reliefs, including Ulga dla młodych, Ulga dla rodzin 4+, and Ulga dla pracujących seniorów. The calculator must therefore support a reduced available limit whenever part of that pool has already been used elsewhere. 21
* **4-Year Statutory Window:** The taxpayer may use the relief for four consecutive tax years, counted either from the year of relocation to Poland or from the following year. This start-year choice is part of the feature and must not be omitted from the logic. 22
* **Eligibility Conditions Must Be Explicitly Assumed or Captured:** Return Relief is not universal. It requires statutory conditions related to tax-residence transfer, prior residence history, citizenship/residency basis, documentation, and non-reuse of the same relief after an earlier move back to Poland. The calculator may simplify these as user declarations, but it must not pretend the toggle is legally safe for every user. 23
* **Chronological Application Rule:** The relief is applied to revenue chronologically from the beginning of the year. The engine must not “optimize” or reassign relief to later months. 24
* **Tax Scale Interaction Constraint:** The `30,000 PLN` tax-free amount belongs to the standard tax-scale regime and must be applied through the regular scale-tax engine after Return Relief allocation. It must not be hardcoded as a separate Return Relief threshold. 25
* **IP Box Compatibility:** If the product supports IP Box, Return Relief must remain compatible with it because official guidance includes business income taxed at 5% IP Box within the scope of Ulga na powrót. 26
* **Ryczałt Cost Exclusion:** For Lump Sum calculations, operating costs must never reduce the taxable base or the Return Relief consumption logic. 27
* **Exclusion of Non-Qualifying Revenue:** Revenue already exempt under other rules, revenue taxed with separate final withholding under the PIT Act, and revenue for which tax collection was waived by regulation must not be counted toward the Return Relief exemption base. 28
* **Exclusion of Health Contribution Impact:** Return Relief must not alter health-insurance calculation logic. The feature affects PIT only.
* **Calendar-Year Reset:** The annual `85,528 PLN` pool resets on 1 January of each tax year, but only within the selected 4-year statutory relief window. 29
* **Non-Refundable / No Carry-Over:** Any unused part of the annual limit expires with the tax year. It does not generate a refundable credit and does not roll into the next year.
* **Annual Return Supremacy:** Monthly outputs are forecasting values. If monthly simplifications differ from final annual return mechanics, the annual tax return is the controlling result. 30

## Expert Recommendations & Edge Cases
1. **Correct the legal object of the relief in the engine:** the current specification treats the relief like an income-based PIT holiday. That is too crude. The exemption is for qualifying **revenue**, so a month with high costs can still consume the 85,528 PLN annual limit. 31
2. **Add the missing 4-year-window start choice:** this is not optional. The taxpayer decides whether the 4-year period starts in the relocation year or the following year, so the calculator needs this configuration or an explicit assumption. 32
3. **Do not hardcode “0 PIT until 115,528 PLN” as a universal rule:** that number is only a simplified tax-scale illustration. In the calculator, the scale-tax engine must apply the 30,000 PLN tax-free mechanism to the post-relief taxable income, not to a generic gross figure. 33
4. **Support external shared-limit consumption:** if the user also has qualifying employment income or another PIT-0 relief in the same year, the B2B calculator must reduce the available Return Relief pool instead of assuming the full 85,528 PLN remains unused. 34
5. **Explicitly define the threshold-breach month behavior:** partial-month exemption must be shown transparently, including exempt revenue, taxable revenue, and resulting PIT. This is critical for user trust and debugging.
6. **Make IP Box interaction explicit:** the original specification omits it, but official guidance includes 5% IP Box activity and the public calculator advertises both IP BOX and Ulga na powrót. This interaction should therefore be implemented and documented, not left implicit. 35
7. **Add eligibility disclaimer / validation text in the UI:** users should be informed that legal eligibility depends on residence-transfer rules and documents confirming foreign tax residence. The calculator should not silently validate legal entitlement on their behalf. 36
8. **Edge case — zero or negative monthly income base with positive revenue:** the month should still reduce the remaining Return Relief pool because the pool is revenue-based, but PIT may remain zero because the tax base is zero after costs.
9. **Edge case — zero revenue month:** the feature should not consume any annual limit and should not create artificial exempt amounts.
10. **Edge case — user becomes ineligible for the selected year:** if the selected projection year falls outside the chosen 4-year window, the toggle should be auto-disabled or the results should show a prominent warning and ignore the relief.
11. **Edge case — rounding:** the engine must round only at presentation or at the same stage used by the main tax engine; otherwise, month-by-month rounding may accidentally exceed the statutory annual cap by a few grosz.
12. **Edge case — mixed-source revenue:** if the user has both B2B income and qualifying employment / zlecenie income in the same tax year, the calculator should not assume B2B revenue is the first or only consumer of the shared PIT-0 pool unless that is explicitly stated by the user.