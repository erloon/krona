# Functional Specification: Time-Based Rate Conversion

## 1. Executive Summary
The Time-Based Rate Conversion feature is a core component of the B2B calculator's revenue engine. Its primary goal is to provide users with the flexibility to input their earnings based on the specific billing model they have negotiated with their contractors (e.g., hourly rates, daily rates, or fixed monthly retainers). The functionality dynamically calculates the base monthly revenue by converting hourly and daily inputs using configurable time multipliers (hours per day, days per month). This unified monthly revenue figure then serves as the fundamental baseline for all downstream Polish tax, ZUS (social security), and VAT calculations.

## 2. Input & Configuration Parameters
| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **Input Mode / Revenue Source** | Monthly (Przychód miesięczny), Daily (Na Dzień), Hourly (Na godz.) | Determines the base unit of calculation for the revenue source. Users can switch between these modes to match their contract terms. |
| **Base Rate Value** | Numeric input (decimal, > 0) | The monetary value of the selected rate. E.g., 150 PLN/hour or 1200 PLN/day. |
| **Days per Month (Dni/mies.)** | Numeric input (Integer, min: 1, max: 31). Default typically 20 or 21 (average working days). | Multiplier used to convert daily rates to a monthly aggregate. Adjusted via +/- stepper or direct input. |
| **Hours per Day (Godz./dzień)** | Numeric input (Integer/Decimal, min: 1, max: 24). Default typically 8. | Multiplier used to convert hourly rates to a daily aggregate. Adjusted via +/- stepper or direct input. |
| **Currency (Waluta)** | PLN, USD, EUR, GBP, CHF | If a foreign currency is selected, the time-converted total is subjected to an exchange rate multiplier to calculate the PLN equivalent for Polish tax purposes. |
| **VAT Rate** | 0% (bez VAT), 5%, 8%, 23% | Applied to the final converted monthly net revenue to determine the gross invoicing amount. |

## 3. Core Functional Logic
The processing engine for time-based rate conversion functions as a real-time reactive calculator. It normalizes all time-based inputs into a standard "Monthly Net Revenue" (`Przychód miesięczny`) before passing the data to the tax engine.

* **Standard Conversion Algorithms:**
    * **Hourly to Monthly:** `Monthly Revenue = Hourly Rate × Hours/Day × Days/Month`
    * **Daily to Monthly:** `Monthly Revenue = Daily Rate × Days/Month`
    * **Monthly to Hourly/Daily (Reverse Calculation if supported):** If a user types directly into the Monthly input, the system may dynamically back-calculate the effective Hourly/Daily rates using the currently set `Hours/Day` and `Days/Month` constants (`Hourly = Monthly / (Days/Month × Hours/Day)`).
* **Currency Normalization Workflow:**
    1. System computes the base Monthly Revenue in the selected foreign currency (e.g., 50 EUR/hour × 8 hours × 20 days = 8,000 EUR).
    2. System queries the stored/live exchange rate multiplier (e.g., EUR to PLN = 4.2629).
    3. System calculates the PLN Monthly Revenue (e.g., 8,000 EUR × 4.2629 = 34,103.20 PLN). 
    4. The PLN value is pushed to the Polish tax/ZUS computation engine.
* **Multiple Revenue Sources Interaction:**
    * Users can add multiple revenue sources (e.g., Source 1: Monthly retainer, Source 2: Hourly consulting). The time-based conversion engine normalizes each source individually into PLN per month, aggregates them, and passes the `Total Monthly Revenue` to the main tax pipeline.

## 4. Output & Reporting Metrics
| Output Metric | Description |
| :--- | :--- |
| **Monthly Net Revenue (Przychód miesięczny)** | The aggregated monthly baseline in PLN, used for income tax (PIT) and health contribution (Składka zdrowotna) calculations. |
| **Effective Daily / Hourly Rate** | Read-only feedback indicating the breakdown of earnings if the user inputs a flat monthly amount, based on the working hours/days configuration. |
| **Gross Invoicing Amount** | The final monthly net revenue plus the selected VAT amount (calculated post-time-conversion). |
| **Total Work Hours per Month** | (Implicit metric) The product of `Hours/Day` and `Days/Month`, driving the volume of the revenue generation. |

## 5. Business Rules & Constraints
* **Working Time Limitations:** * `Days/Month` cannot exceed 31.
    * `Hours/Day` cannot exceed 24. 
* **Tax Engine Dependencies (Polish Context):** * All Polish statutory thresholds (e.g., entering the second tax bracket at 120,000 PLN/year on the Tax Scale, or the 300,000 PLN health contribution tier for Lump Sum / Ryczałt) are evaluated on an *annualized* basis. The system multiplies the converted monthly revenue by 12 (or remaining months) to forecast whether the rate will trigger a higher tax threshold or ZUS band.
    * VAT is calculated *after* the time-based conversion but *before* Polish income tax deductions. Foreign currency B2B rates usually imply export of services (often "0% (bez VAT)" or reverse charge), which the system handles by calculating PIT/ZUS on the net PLN equivalent without adding local 23% VAT to the gross total.
* **Absence & Time Off (Odłóż na urlop):** If the user selects the "Odłóż na urlop" (Save for holidays) setting, the system mathematically reduces the effective `Days/Month` across an annualized average to simulate unpaid time off (since typical B2B contracts do not provide paid leave), thus lowering the average real Monthly Revenue passed to the tax engine.
* **Real-time UI Triggers:** Changing any input variable (Rate, Hours, Days) triggers an immediate, asynchronous recalculation of all dependent variables and updates the UI (PIT, ZUS, VAT, Net Income) instantly without requiring a page reload.
