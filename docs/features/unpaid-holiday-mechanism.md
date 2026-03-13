### 2.4 Deep Dive: Unpaid Holiday Mechanism ("Odłóż na urlop")

**Overview:**
Unlike standard employment contracts (UoP), B2B contractors are not statutorily entitled to paid leave. The "Save for holidays" (Odłóż na urlop) feature allows the user to specify the number of unpaid days off they plan to take annually. The calculator dynamically recalculates the real monthly net income by distributing the "loss" of income from those unworked days across the entire year.

**Functional Mechanics:**
1. **Input:** A numeric input field where the user enters the desired number of holiday days per year (e.g., 20 or 26).
2. **Calculation Logic:** * The system calculates the total potential working days in a year (e.g., 252 days).
   * It subtracts the requested holiday days to find the *actual* working days.
   * For daily and hourly rates, it computes the annual gross revenue based on actual working days, then divides by 12 to provide an adjusted, smoothed monthly average.
   * For fixed monthly rates, it calculates the daily equivalent of the monthly rate, deducts the value of the holiday days from the annual total, and averages it back to a monthly figure.

**Edge Cases to Test:**
* **Exceeding Maximum Days:** User inputs a number of holiday days that exceeds the total working days in a year (e.g., >365 or >252). The system should cap the input or display a validation error.
* **Fractional Days:** User attempts to input half-days (e.g., 10.5). The system must define if it accepts floats or restricts to integers.
* **Interaction with Zero Income:** If the user has set 0 PLN revenue, the holiday calculation should not result in negative revenues or crash the engine (division by zero safeguards).
* **Leap Years:** Does the system hardcode 252 working days, or does it dynamically calculate based on the current calendar year (e.g., 2026)?
* 
