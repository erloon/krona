# Business-Technical Analysis Document
## Target Application: Kalkulator B2B (B2B Calculator Module)
**Date:** March 13, 2026

### 1. Executive Summary
The analyzed application is a specialized financial calculator designed for Polish sole traders (B2B contractors - JDG). Its primary purpose is to calculate net monthly income by accurately deducting applicable taxes (PIT, VAT) and social security contributions (ZUS, Health contribution). The tool also features a comparison module (B2B vs. UoP - Employment Contract).

### 2. Functional Scope (Application Features)
The B2B calculator focuses on real-time net income estimation based on highly configurable user inputs. Key functionalities include:
* **Multi-Source Revenue Management:** Users can add and manage multiple streams of income independently.
* **Time-Based Rate Conversion:** The calculator supports inputs as monthly, daily, or hourly rates, automatically converting them based on configurable working days per month or hours per day.
* **Multi-Currency Support:** Income can be entered in various currencies (PLN, USD, EUR, GBP, CHF), utilizing predefined or live exchange rates.
* **Advanced Tax Configuration:** Full support for the Polish tax system, including Tax Scale (Skala podatkowa), Flat Tax (Podatek liniowy 19%), and Lump Sum (Ryczałt).
* **ZUS (Social Security) Adjustments:** Calculations adapt to the user's specific ZUS status (No relief, Preferential rate, Startup relief, or simultaneous Employment Contract).
* **Tax Reliefs & Benefits:** Toggles for IP BOX, Return Relief (Ulga na powrót), Joint taxation with a spouse, and provisions for unpaid holidays.
* **Cost Management:** A feature to log business expenses to accurately offset the tax base.
* **Real-time Summary Dashboard:** Immediate calculation of deductions, providing a high-level view and an expandable detailed summary.
* **State Management:** Functionality to share the calculation (URL/state sharing) and reset the inputs.

### 3. User Interface (UI) Configuration
The UI is divided into several logical input/output blocks:

* **Result Dashboard (Top/Sticky):**
    * **Main Output:** "Net income per month" (Przychód netto miesięcznie).
    * **Deduction breakdown:** PIT, VAT, ZUS, and Health Contribution (Zdrowotna).
    * **Actions:** "Share" (Udostępnij), "Reset", "Expand detailed summary".
* **Incomes Section (Przychody B2B):**
    * List of current income sources with an "Add source" (Dodaj źródło przychodu) button.
    * Inputs per source: Amount, Currency dropdown, VAT rate dropdown (0%, 5%, 8%, 23%).
    * Modifiers: +/- adjusters for Days/Month and Hours/Day.
* **Costs Section (Koszty prowadzenia działalności):**
    * "Add cost" (Dodaj koszt) button to input business expenses.
* **Settings Panel (Ustawienia):**
    * *Radio buttons:* Tax form selection, ZUS status selection.
    * *Checkboxes/Toggles:* Voluntary sickness insurance, Joint taxation, IP BOX, Return relief.
    * *Numeric Input:* "Save for holidays" (Odłóż na urlop) - specifying the number of unpaid days.

### 4. Potential Data Structure (JSON Model)
Based on the application's behavior, the underlying data structure managing the state likely resembles the following JSON schema:

{
  "calculatorState": {
    "incomes": [
      {
        "id": "uuid-string",
        "billingType": "MONTHLY | DAILY | HOURLY",
        "baseAmount": 10000.00,
        "currency": "PLN",
        "vatRate": 0.23,
        "workingDaysPerMonth": 21,
        "workingHoursPerDay": 8
      }
    ],
    "costs": [
      {
        "id": "uuid-string",
        "netAmount": 0.00,
        "vatRate": 0.23
      }
    ],
    "taxSettings": {
      "taxationForm": "SCALE | FLAT_19 | LUMP_SUM",
      "zusReliefType": "NONE | PREFERENTIAL | STARTUP | UOP",
      "voluntarySicknessInsurance": false,
      "unpaidHolidayDays": 0,
      "jointTaxation": false,
      "ipBox": false,
      "returnRelief": false,
      "familyRelief": false
    }
  },
  "calculatedResults": {
    "grossRevenue": 10000.00,
    "netIncome": 6787.25,
    "deductions": {
      "pit": 685.41,
      "vat": 2300.00,
      "zus": 1788.29,
      "healthContribution": 739.05
    }
  }
}
