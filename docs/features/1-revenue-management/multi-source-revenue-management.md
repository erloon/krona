# Functional Specification: Multi-Source Revenue Management (MSRM)

> Assumption used for this rewrite: the target functionality is **Multi-Source Revenue Management**, because the placeholder name was left empty and the provided source file is `docs/features/1-revenue-management/multi-source-revenue-management.md`.

## 1. Executive Summary
The MSRM engine is the revenue orchestration layer of the B2B calculator. Its purpose is to collect, normalize, and aggregate **multiple independent B2B revenue streams** into one monthly taxable basis, and then pass that consolidated basis into downstream Polish tax, ZUS, health insurance, and VAT calculations.

The live calculator already exposes a **"Przychody B2B"** section with a running **sum**, individual **source cards**, **currency selection**, and **VAT selection** at source level, so the feature must be treated as a structured list of revenue sources rather than a single gross revenue input. 0

MSRM must therefore:
- support **1..N active revenue sources**,
- calculate each source independently,
- normalize each source to a monthly PLN value before aggregation,
- preserve tax-critical distinctions that affect the final result,
- ensure that entrepreneur-level obligations (PIT, ZUS, health contribution) are calculated **once per taxpayer**, not once per source.

The feature transforms aggregated business revenue into a final estimated **Net "To-Hand" Profit**, while keeping the internal breakdown transparent and auditable.

---

## 2. Revenue Stream Configuration

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **Revenue Sources** | Dynamic list, minimum 1 active source, no fixed upper limit in business logic | The core MSRM entity. Each source is treated as an independent revenue record and is recalculated separately before aggregation. |
| **Source Label / Identifier** | Auto-generated (`Source 1`, `Source 2`, etc.) with optional editable label | Improves readability in UI and detailed reporting. Internal IDs must remain stable even if source order changes. |
| **Gross Revenue / Revenue Amount** | Numeric Input (PLN or foreign currency, decimal, `> 0`) | Represents the base revenue value for a given source. For tax consistency, the input should be treated as the **net commercial value before output VAT**, because VAT is configured separately on the same source card in the live calculator. 1 |
| **Aggregation Scope** | Included / Excluded (implicit via source deletion or disable state) | Only included sources participate in total revenue, PIT base forecasting, health insurance thresholds, and VAT sales totals. |
| **Taxation Form** | Tax Scale (Skala), Flat Tax (Liniowy), Lump Sum (Ryczałt) | Determines how the **aggregated result** is taxed. The taxation form is global for the entrepreneur, not per source. |
| **Lump Sum Rate** | 2%, 3%, 5.5%, 8.5%, 10%, 12%, 12.5%, 14%, 15%, 17% | Relevant only for Ryczałt. Polish rules allow different rates depending on activity type, and official PIT-28 structures separate revenue by rate. Therefore, when multiple sources have different business classifications, the system should support **per-source ryczałt rate assignment** or block the scenario as unsupported. 2 |
| **IP Box** | Toggle (On/Off) | Applies a preferential **5% PIT rate only to qualified IP income**, not to all business revenue automatically. If the user has mixed qualified and non-qualified revenue sources, MSRM must either support source-level qualification allocation or disable global IP Box estimation to avoid overstating net income. 3 |
| **Joint Settlement** | None, With Spouse, As Single Parent | Available only for Tax Scale. The toggle must be disabled/hidden for Flat Tax and Lump Sum in standard scenarios, because preferential settlement is not available there except effectively "zero-return" edge cases, which should not drive normal calculator UX. 4 |

### Core Multi-Source Aggregation Logic
1. Each source is validated independently.
2. Each source is normalized into a **monthly PLN net-of-output-VAT revenue value**.
3. All included sources are summed into **Total Monthly Business Revenue**.
4. The total is passed into the taxation engine, cost engine, ZUS engine, and health insurance engine.
5. Revenue-source metadata required for tax correctness (for example: VAT rate, ryczałt rate eligibility, IP Box qualification) must remain available after aggregation.

### Functional Clarification
MSRM owns the **source list and aggregation behavior**.  
It may consume monthly normalized values coming from other modules (for example time-based conversion or currency conversion), but MSRM remains responsible for:
- combining sources,
- preventing double counting,
- preserving source-level tax attributes needed later in the pipeline.

---

## 3. Business Expense & VAT Module

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **Operating Costs** | Numeric Input (PLN Net) | In Tax Scale and Flat Tax, costs reduce taxable income. In Lump Sum, they do **not** reduce the tax base, because ryczałt is levied on revenue without deducting expenses; however, they still reduce real cash profit. 5 |
| **VAT Status** | Per-source VAT rate: 0%, 5%, 8%, 23% | The live calculator exposes VAT on the source card, so VAT on sales must be modeled **per revenue source**, then aggregated into a total sales VAT result. VAT must not increase PIT or ZUS bases. 6 |
| **Company Car** | None, Private & Business, Business Only | Affects VAT/cost deductibility on expense-side logic only. It must **not** modify revenue-source valuation or output VAT on sales. |
| **Cost Allocation Model** | Global business pool | Costs are paid by the entrepreneur, not by a specific revenue stream unless explicit allocation is supported. Therefore, in baseline MSRM behavior, costs should be deducted once at the entrepreneur level after revenue aggregation. |
| **VAT Refund / VAT Payable Result** | Auto-calculated | Sales VAT from all revenue sources is aggregated and then offset by deductible input VAT from costs. The calculator should present the net VAT position separately from PIT/ZUS metrics. |

### VAT & Revenue Handling Rules
- Revenue amount and VAT amount must remain separate values.
- Total invoiced amount = net revenue + output VAT.
- PIT and ZUS/health contribution calculations must use the taxable business basis, not invoice gross including VAT.
- If multiple sources use different VAT rates, the engine must aggregate VAT by source and then sum the totals.

---

## 4. Social Security (ZUS) Configuration

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **ZUS Scheme** | Standard, Start-up Relief, Small ZUS Plus, No ZUS / overlapping title scenario | Determines the base calculation for mandatory social contributions. This is a **global entrepreneur setting**, not a per-source one. |
| **Sickness Insurance** | Toggle (On/Off) | Voluntary addition; increases total ZUS cost but provides benefit eligibility. It is charged once per entrepreneur, never multiplied by the number of revenue sources. ZUS social rates in 2026 still include the voluntary sickness component at 2.45% of the applicable base. 7 |
| **Labor Fund (FP)** | Auto-calculated | Added when applicable under the selected ZUS status. Also global, never source-level. |
| **ZUS Payment Cardinality** | Exactly one entrepreneur-level obligation per period | Prevents a major modeling error: adding a second revenue source must not duplicate social contributions. |
| **Relief Eligibility Boundary** | Based on entrepreneur status, not source composition | Switching source count or source amounts must not automatically change the social contribution scheme unless an explicit statutory threshold is crossed in the relevant ZUS module. |

### Core ZUS Rule in MSRM
Multiple invoices or clients do **not** create multiple ZUS obligations.  
MSRM must aggregate revenue for tax/health purposes, but social contribution schemes remain singular and entrepreneur-based.

---

## 5. Health Insurance (Składka Zdrowotna) Logic
The system applies distinct functional rules based on the selected Taxation Form and on the **aggregated** business result:

* **Tax Scale:** Calculated as **9% of income**. Health insurance is not deductible and may not be recognized as a tax-deductible cost. Tax Scale itself remains based on **12% up to 120,000 PLN** and **32% above that threshold**, with a **3,600 PLN tax-reducing amount**. 8
* **Flat Tax:** Calculated as **4.9% of income**. A statutory minimum floor applies. In 2026, the minimum monthly health contribution from **1 February 2026 to 31 January 2027** is **432.54 PLN**. Paid health contributions may be deducted from income or treated as tax-deductible cost up to an annual limit of **14,100 PLN in 2026**. 9
* **Lump Sum:** Fixed monthly health contribution based on **cumulative annual revenue thresholds**, not income. In 2026 the monthly amounts are: **498.35 PLN** for revenue up to **60,000 PLN**, **830.58 PLN** for revenue above **60,000 PLN** up to **300,000 PLN**, and **1,495.04 PLN** above **300,000 PLN**. Annual reconciliation applies; if the annual threshold is ultimately exceeded, the higher rate becomes due for the relevant settlement logic. 10
* **IP Box Interaction:** IP Box changes the PIT treatment of qualified income, but it does **not** replace the health insurance method with a separate 5% health regime. Official guidance groups income-based health determination for Scale / Flat / qualified IP contexts under the same income-based logic family. 11

### Additional Health Insurance Rules Required for MSRM
- For Tax Scale and Flat Tax, the income base must be built from the **aggregated monthly result after applicable costs and social contributions**.
- For Lump Sum, the threshold forecast must use the **sum of all included revenue sources** across the year.
- If the user is on Lump Sum and has revenue taxed at different ryczałt rates, any deductible share of health contribution must be allocated proportionally across revenue buckets, because official guidance requires deductions to be apportioned in proportion to revenues taxed at different rates. 12
- The UI must distinguish between:
  - **current monthly estimate**, and
  - **possible annual correction** for Lump Sum health insurance when cumulative annual revenue crosses a threshold late in the year.

---

## 6. Output & Reporting Metrics

| Output Metric | Description |
| :--- | :--- |
| **Aggregated Monthly Revenue (PLN)** | Sum of all active sources after monthly normalization into PLN and before entrepreneur-level deductions. |
| **Revenue Source Breakdown** | Readable list of each source with its revenue amount, VAT rate, contribution to total revenue, and inclusion status. |
| **Net Income (To-Hand)** | Final liquid amount after PIT, ZUS, health contribution, business costs, and VAT cash effect are accounted for according to the calculator model. |
| **Total Tax Liability** | The sum of Personal Income Tax (PIT) owed under the selected taxation form, after applicable deductions. |
| **Total ZUS Cost** | Cumulative entrepreneur-level social contributions plus health contribution. Must not scale with the number of revenue sources. |
| **Sales VAT Total** | Sum of output VAT from all active revenue sources. |
| **Net VAT Position** | Output VAT from revenue minus deductible input VAT from costs. |
| **Total Invoiced Amount** | Sum of all source revenues plus their respective VAT amounts. |
| **Effective Tax Rate** | Percentage of aggregated revenue lost to PIT and public burdens, excluding or including VAT depending on the reporting definition selected in UX. |
| **Threshold Forecast Indicator** | Explains whether the current aggregated annualized result approaches or exceeds a tax or health contribution threshold. |

### Reporting Transparency Requirements
The result layer should make it obvious:
- what comes from **source aggregation**,
- what is charged **once globally**,
- what is only an **annual forecast** rather than a legally final monthly obligation.

---

## 7. Business Rules & Constraints
* **True Multi-Source Model:** The engine must support a list of revenue sources. A single `Gross Revenue` field is insufficient for the feature scope.
* **At Least One Active Source:** The calculator cannot operate with zero active revenue sources.
* **Immediate Recalculation:** Adding, editing, deleting, reordering, enabling, or disabling any source triggers a full recalculation of all dependent fields.
* **No Negative Revenue Inputs:** Each active source amount must be greater than zero. Negative source values are invalid.
* **No Double Counting of Global Obligations:** PIT, ZUS social contributions, health contribution floors, and Labor Fund are entrepreneur-level calculations and must be applied once per period.
* **VAT Separation Rule:** VAT is computed per source and summed, but it must remain outside PIT income and outside ZUS income.
* **Cost Deduction Rule:** Operating costs reduce taxable income only where the selected taxation form permits it. For Lump Sum, costs reduce real profitability but not the revenue tax base. 13
* **The 32% Threshold:** Under Tax Scale, annual aggregated taxable income above **120,000 PLN** moves the surplus into the 32% bracket. The tax-reducing amount is **3,600 PLN**. The threshold must be monitored on the **combined annual result** of the entrepreneur, not per source. 14
* **Joint Settlement Availability:** The options **With Spouse** and **As Single Parent** must be available only under Tax Scale in normal calculator usage. Flat Tax and Lump Sum should disable these options to prevent misleading estimates. 15
* **Ryczałt Base Rule:** On Lump Sum, tax is levied on revenue, not revenue minus expenses. If the user has different source types with different ryczałt rates, those sources must be stored and taxed separately. 16
* **Ryczałt Health Threshold Rule:** Health contribution under Lump Sum depends on cumulative annual revenue across all sources. Crossing a threshold can require annual correction. 17
* **Minimum Health Contribution Floor:** For income-based health contribution contexts, the system must not allow the monthly value to fall below the applicable statutory minimum, which is **432.54 PLN** from **1 February 2026** for the relevant year window. 18
* **IP Box Qualification Rule:** The IP Box toggle cannot blindly apply a 5% rate to all business revenue. It is valid only for qualified IP income and should require either explicit source allocation or a strong explanatory warning. 19
* **Precision & Rounding:** Internal calculations should preserve higher precision, while user-visible monetary outputs should round to 2 decimal places in PLN.
* **Forecast vs. Settlement Distinction:** Where Polish rules are annual or subject to reconciliation (especially Lump Sum health contribution and IP Box), the UI must clearly label values as **estimated** rather than final statutory settlements.
* **Validation Against Impossible Combinations:** The engine should block or warn on combinations that materially misstate the result, especially:
  * global IP Box applied to mixed qualified/non-qualified sources,
  * global single Lump Sum rate applied to sources that should use different statutory rates,
  * use of Joint Settlement while Flat Tax or Lump Sum is selected.

## Expert Recommendations & Edge Cases
1. **Model revenue as a collection, not a scalar.**  
   The current source markdown under-specifies the defining behavior of the feature. MSRM should formally own a `RevenueSource[]` collection with stable IDs and source-level metadata.

2. **Make VAT explicitly source-level.**  
   The live UI already suggests this design. The specification should not imply a single global VAT status for all revenues when the source cards expose VAT directly. 20

3. **Separate "commercial revenue" from "tax base".**  
   This avoids one of the most common B2B calculator errors in Poland: treating invoice gross (with VAT) as taxable income.

4. **Handle mixed Lump Sum rates correctly.**  
   This is the most important missing business rule for a true multi-source calculator. If the entrepreneur has two streams taxed under different ryczałt rates, tax and deductible-health allocation cannot be computed correctly from one global rate. 21

5. **Do not multiply ZUS by number of clients.**  
   This sounds obvious, but calculators frequently get distorted when source-based modeling is introduced. The spec must explicitly state that ZUS remains global.

6. **Treat IP Box as partial, not universal.**  
   If a software contractor has one qualified development stream and one ordinary advisory stream, a global IP Box toggle materially overstates take-home pay unless allocation is supported. 22

7. **Expose annual threshold behavior clearly.**  
   Users need UX hints when:
   - aggregated annual income approaches the 120,000 PLN Tax Scale breakpoint,
   - aggregated annual revenue approaches the 60,000 PLN / 300,000 PLN Lump Sum health thresholds. 23

8. **Add edge-case messaging for source deletion and zeroing.**  
   When the last source is removed, the engine should either:
   - keep one empty draft source, or
   - block calculation and show a clear state message.

9. **Add source-level contribution percentages.**  
   Showing each source’s share of total revenue improves trust and helps users understand why thresholds were crossed.

10. **Clarify legal-estimation boundaries.**  
    The calculator should explicitly warn that:
    - actual foreign-currency tax settlement may differ from estimator values,
    - Lump Sum health insurance can require annual correction,
    - IP Box is settled based on qualified income evidence and records,
    - the calculator is an estimator, not a final tax filing engine.