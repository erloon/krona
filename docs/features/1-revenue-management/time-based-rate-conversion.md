# Functional Specification: Time-Based Rate Conversion

## 1. Executive Summary
The Time-Based Rate Conversion feature is the normalization layer for revenue entry within the B2B calculator. Its purpose is to let the user define a single revenue source using the commercial unit actually used in their contract—monthly, daily, or hourly—and convert that value into one standardized **Monthly Revenue Basis** (`Przychód miesięczny`) for further processing.

This module is intentionally limited to **time-unit normalization only**. It does **not** calculate PIT, ZUS, VAT, or cross-source aggregation by itself. Instead, it determines the monthly revenue basis for one source and then passes that normalized value to downstream modules responsible for currency conversion, multi-source aggregation, VAT handling, and Polish tax/ZUS calculations.

From a Polish B2B perspective, this distinction is important: contractors often negotiate rates per hour or per day, but statutory settlement modules require a stable monthly revenue basis for forecasting liabilities and take-home pay. This feature therefore acts as a deterministic conversion engine, not a tax engine.

---

## 2. Input & Configuration Parameters

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **Input Mode / Revenue Source** | Monthly (`Przychód miesięczny`), Daily (`Na dzień`), Hourly (`Na godz.`) | Defines the active commercial unit for the current revenue source. Only one mode is authoritative at a time for a given source card. |
| **Base Rate Value** | Numeric input (decimal, `>= 0`) | The contractual rate in the selected mode, e.g. 25,000 PLN/month, 1,200 PLN/day, or 180 PLN/hour. Negative values are not allowed. |
| **Days per Month (`Dni/mies.`)** | Numeric input, default application value, practical range `> 0` and `<= 31` | Represents **billable days**, not calendar days. Used directly in Daily and Hourly modes. In Monthly mode it is optional and only required for reverse informational calculations (effective daily/hourly rate). |
| **Hours per Day (`Godz./dzień`)** | Numeric input (decimal allowed), practical range `> 0` and `<= 24` | Represents the billable working hours used for conversion in Hourly mode. In Daily mode it may be used only for derived “effective hourly” feedback. In Monthly mode it is optional unless reverse informational calculations are shown. |
| **Currency** | Inherited from Currency Conversion Module (e.g. PLN, USD, EUR, GBP, CHF) | Not part of the core time-conversion formula. This module first computes the monthly amount in the source currency; FX normalization to PLN is handled by the dedicated Currency Conversion Module. |
| **VAT Rate** | Inherited from VAT Calculation Logic | Not part of the core time-conversion formula. This module outputs a **VAT-exclusive revenue basis**; gross invoicing and VAT obligations are computed downstream. |
| **Mode-Specific Input Visibility** | Dynamic UI behavior | Monthly mode should minimize unnecessary workload inputs; Daily mode should require days/month; Hourly mode should require both days/month and hours/day. Hidden fields may retain previous user values for seamless switching, but must not silently affect calculations when not applicable. |
| **Input Precision / Step Behavior** | Decimal-friendly numeric controls | The module should accept real business values such as `7.5` hours/day or `175.50` PLN/hour. Precision used for internal math must be higher than display precision to avoid compounding rounding errors. |

---

## 3. Core Functional Logic
The Time-Based Rate Conversion engine is a real-time, deterministic calculator that transforms the active rate input into a single **Monthly Revenue Basis** for one revenue source.

### Standard Conversion Algorithms
* **Monthly to Monthly (authoritative value):**  
  `Monthly Revenue Basis = Monthly Rate`

* **Daily to Monthly:**  
  `Monthly Revenue Basis = Daily Rate × Days/Month`

* **Hourly to Monthly:**  
  `Monthly Revenue Basis = Hourly Rate × Hours/Day × Days/Month`

### Reverse / Informational Calculations
Reverse calculations should be treated as **derived feedback only**, not as a second authoritative input source.

* **Monthly to Effective Daily Rate (if supported):**  
  `Effective Daily Rate = Monthly Revenue Basis / Days/Month`

* **Monthly to Effective Hourly Rate (if supported):**  
  `Effective Hourly Rate = Monthly Revenue Basis / (Days/Month × Hours/Day)`

* **Daily to Effective Hourly Rate (if supported):**  
  `Effective Hourly Rate = Daily Rate / Hours/Day`

These outputs must only be shown when the required denominators are present and greater than zero. The module must never perform division by zero and must never fabricate derived values from incomplete workload inputs.

### Mode-Dependent Behavior
* **Monthly Mode**
  * The entered monthly amount is the source of truth.
  * `Days/Month` and `Hours/Day` are optional and should not change the primary monthly value.
  * If the UI displays effective daily/hourly equivalents, they must be clearly labeled as estimates derived from the optional workload assumptions.

* **Daily Mode**
  * The entered daily amount is the source of truth.
  * `Days/Month` is mandatory for monthly normalization.
  * `Hours/Day` is not required for the monthly result itself, but may be used for optional effective-hourly feedback.

* **Hourly Mode**
  * The entered hourly amount is the source of truth.
  * Both `Hours/Day` and `Days/Month` are mandatory.
  * Missing either parameter must block monthly normalization and surface an explicit validation state.

### Calculation Boundary / Dependency Order
To keep module boundaries clean and auditable, the processing order should be:

1. Determine the active source mode (Monthly / Daily / Hourly).
2. Normalize the source into a **Monthly Revenue Basis** using only time-based inputs.
3. Pass the normalized result to downstream modules:
   * **Currency Conversion Module** for PLN normalization if the source currency is not PLN.
   * **Multi-Source Revenue Management** if more than one source exists.
   * **VAT Calculation Logic** for gross invoice presentation and VAT settlement.
   * **Tax and ZUS engine** for Polish statutory calculations.

### Multiple Revenue Sources Interaction
This feature does **not** aggregate multiple contracts or invoices by itself. In a multi-source scenario, the Time-Based Rate Conversion logic is executed **independently per source**, and each source emits its own normalized monthly revenue basis. Aggregation belongs to the dedicated Multi-Source Revenue Management layer.

### Real-Time Reactivity
Any change to:
* input mode,
* base rate value,
* days/month,
* hours/day,

must trigger an immediate recalculation of all dependent outputs for the current source without page reload. The recalculation must be scoped to the affected source card and then propagated to downstream totals.

---

## 4. Output & Reporting Metrics

| Output Metric | Description |
| :--- | :--- |
| **Monthly Revenue Basis (`Przychód miesięczny`)** | The normalized monthly value for the current source before downstream tax/ZUS/VAT presentation. This is the primary output of the module. |
| **Effective Daily / Hourly Rate** | Read-only derived feedback showing the implied commercial rate when the user enters a monthly or daily value and provides workload assumptions. These values are informational, not authoritative. |
| **Total Work Hours per Month** | `Hours/Day × Days/Month`. Used only where relevant, primarily in Hourly mode and in effective-rate previews. |
| **Active Validation State** | UI state indicating whether the module has sufficient data to calculate a valid monthly basis (e.g. missing days/month in Daily mode or missing hours/day in Hourly mode). |
| **Source-Level Monthly Amount in Source Currency** | If a foreign currency is selected elsewhere, this module outputs the normalized monthly amount in that source currency before FX conversion. |
| **Readability / Transparency Hints** | Inline helper text or tooltips clarifying whether displayed values are direct inputs or derived estimates, reducing misinterpretation of effective hourly/daily rates. |

---

## 5. Business Rules & Constraints
* **Strict Scope Rule:** This module only converts commercial time units into a monthly revenue basis. It must not directly calculate PIT, ZUS, VAT, health contribution, or inter-source totals.
* **VAT Separation Rule (Polish B2B Context):** The output of this module should represent the revenue basis used for later statutory processing. VAT must not be added inside the time-conversion formula itself.
* **No Implicit Calendar Logic:** `Days/Month` must be interpreted as user-declared **billable days**, not automatically derived working days. This module should not independently exclude weekends, public holidays, or sick leave days.
* **Workload Field Relevance:**
  * In **Monthly mode**, workload fields are optional and informational only.
  * In **Daily mode**, `Days/Month` is required; `Hours/Day` is optional.
  * In **Hourly mode**, both `Days/Month` and `Hours/Day` are required.
* **Validation Limits:**
  * `Base Rate Value` cannot be negative.
  * `Days/Month` must be greater than `0` and not exceed `31`.
  * `Hours/Day` must be greater than `0` and not exceed `24`.
* **Precision Rule:** Internal calculations should preserve sufficient decimal precision throughout the formula chain. Display rounding should be applied only at presentation time, preferably to 2 decimal places for monetary values.
* **No Silent Derived Overrides:** Reverse-calculated effective rates must never overwrite the authoritative user input unless the product explicitly supports a synchronized bidirectional editing model and documents which field is the source of truth.
* **Division Safety Rule:** Derived outputs requiring division must remain blank or explicitly unavailable when the denominator is missing or zero.
* **Per-Source Isolation:** In multi-source scenarios, changing the time settings of one source must not mutate the input assumptions of another source.
* **Holiday / Absence Boundary:** If the application includes “Odłóż na urlop” or similar absence simulation, that mechanism must adjust billable capacity outside this module’s core formula. Time-Based Rate Conversion should consume the final applicable workload assumptions, not recalculate holiday logic internally.
* **Foreign Currency Boundary:** If the commercial rate is denominated in a foreign currency, the time-based conversion must still run first in that currency. Exchange-rate law and PLN conversion methodology remain outside this module.
* **UX Transparency Rule:** The UI must clearly distinguish between:
  * direct contractual input,
  * workload assumptions,
  * derived effective rates,
  * downstream tax/VAT results.

---

## Expert Recommendations & Edge Cases
1. **Clarify “billable days” explicitly in the UI.** Users often confuse `Dni/mies.` with calendar days or working days. A tooltip should state that this field means the number of days actually invoiced in a typical month.

2. **Allow decimal hours and optionally fractional days.** Polish B2B contracts commonly use values such as `7.5 h/day`, and some contracts bill partial days (`0.5 day`). Even if the default stepper is integer-based, the specification should support manual decimal entry.

3. **Treat Monthly mode as the cleanest authoritative scenario.** Do not require workload assumptions in Monthly mode unless the product wants to display implied daily/hourly equivalents. This avoids forcing artificial assumptions into contracts that are pure monthly retainers.

4. **Avoid circular recalculation.** If reverse values are shown, they should be read-only by default. Otherwise the product can enter ambiguous states where editing one derived field unexpectedly rewrites another.

5. **Preserve user intent when switching modes.** The safest UX is to retain the last entered values per mode on the source card, while recalculating only from the currently active mode. This prevents frustrating data loss when users compare hourly vs daily vs monthly billing assumptions.

6. **Show soft warnings for unrealistic workloads.** Values such as `24 days/month` and `14+ hours/day` may still be mathematically valid, but the UI should warn that they are atypical and may distort the real profitability forecast.

7. **Use null/empty semantics, not silent zeroes.** Empty workload inputs should not be interpreted as `0`, because that creates misleading `0 PLN` outputs instead of a clear “missing data” state.

8. **Keep this module independent from calendar, tax, and VAT logic.** The original draft mixed in FX, VAT, and multi-source responsibilities. Those should remain dependency references only, so this specification stays auditable and modular.

9. **Display calculation lineage per source.** For transparency, the UI should be able to show formulas such as `180 × 8 × 20 = 28,800` so users understand how the monthly baseline was created before taxes are applied.

10. **Rounding should be presentation-only.** For example, hourly contracts with decimal hours can accumulate visible rounding differences if the system rounds each intermediate step too early. Internally, the engine should preserve precision until the final displayed amount.