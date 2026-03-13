### 2.1 Deep Dive: Multi-Source Revenue Management

**Overview:**
The Multi-Source Revenue Management module is a core feature that allows B2B contractors to simulate income from multiple concurrent clients, projects, or contracts. Instead of manually pre-calculating a single blended average, users can input distinct parameters for each revenue stream. The system aggregates these inputs, normalizes them into a single monthly sum in the base currency (PLN), and feeds this total into the main tax calculation engine.

**Functional Mechanics:**

1.  **Source Creation and Deletion:**
    * **Initialization:** By default, the calculator provides one active income source block ("Źródło 1").
    * **Addition:** Users can click the "Add source" (Dodaj źródło przychodu) button to generate additional, independent income blocks (e.g., "Źródło 2", "Źródło 3").
    * **Removal:** Each dynamically added source can be individually removed from the calculation.

2.  **Input Parameters per Source:**
    Each revenue stream operates as an isolated calculation unit with the following configurable attributes:
    * **Base Amount:** A numeric input field for the gross/net revenue.
    * **Billing Cycle (Rate Type):** The system dynamically handles different billing models:
        * *Monthly Rate:* Fixed amount per month.
        * *Daily Rate:* Amount per day. Activates a modifier to set the number of working days per month (default typically 21).
        * *Hourly Rate:* Amount per hour. Activates modifiers for both working hours per day (default 8) and working days per month.
    * **Currency Selection:** A dropdown allowing the user to select the currency for that specific stream (PLN, USD, EUR, GBP, CHF). The system uses predefined or live exchange rates to convert foreign currencies to PLN for the final tax base.
    * **VAT Rate:** A dropdown to apply the correct VAT rate per client/project (0% / No VAT, 5%, 8%, 23%). This is crucial for distinguishing between domestic B2B contracts (usually 23%) and foreign B2B exports (usually 0% or reverse charge).

3.  **Data Normalization and Aggregation:**
    * **Conversion Engine:** Regardless of the input method (e.g., 50 EUR/hour vs. 15,000 PLN/month), the calculator converts each source into a *Monthly PLN Equivalent*.
    * **Summation:** The application calculates a rolling "Total" (Suma) at the top of the Incomes Section, representing the combined monthly revenue from all active sources.
    * **Integration with Tax Engine:** This final aggregated monthly sum is then passed down to the Settings Panel and Deductions Engine to calculate the overall ZUS, PIT, and net income.
