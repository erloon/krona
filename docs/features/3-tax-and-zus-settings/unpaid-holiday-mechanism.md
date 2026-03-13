# Functional Specification: Unpaid Holiday Mechanism (Urlop Bezpłatny)

## 1. Executive Summary
The Unpaid Holiday Mechanism is a critical simulation component within the B2B calculator designed to reflect the financial reality of "no work, no pay" inherent in most Business-to-Business (B2B) contracts in Poland. Unlike employment contracts (UoP), B2B contractors typically do not have statutory paid leave. This feature allows users to simulate how planned absences or downtime (e.g., 20 or 26 days of "holiday" per year) affect their net income, effective hourly rate, and annual profitability after accounting for fixed costs like ZUS contributions and taxes.

## 2. Input & Configuration Parameters
| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| Days of Unpaid Holiday | Integer (typically 0-365) | Reduces the total billable days in the year, directly lowering the annual gross revenue. |
| Daily Rate / Monthly Rate | Numeric (PLN) | Serves as the base for calculating the "loss" incurred during the holiday period. |
| Month Selection | Checkbox/Dropdown (Jan-Dec) | Distributes the unpaid days across specific months to show the impact on cash flow and progressive tax thresholds. |
| Inclusion in Annual View | Toggle (Yes/No) | Determines if the holiday cost is amortized across the whole year or treated as a specific one-month deficit. |

## 3. Core Functional Logic
The mechanism operates as a revenue-reduction engine rather than an expense-addition engine. Its logic is integrated into the primary B2B calculation stream as follows:

* **Revenue Adjustment:**
    * The system calculates the **Standard Billable Days** in a year (Total days - weekends - public holidays).
    * The **Active Working Days** are calculated as: `Standard Billable Days - Unpaid Holiday Days`.
    * The **Gross Annual Revenue** is adjusted: `Active Working Days * Daily Rate`.
* **Fixed Cost Decoupling:**
    * Regardless of the holiday duration (unless the business is officially suspended/zawieszona), the system continues to apply full fixed costs: **ZUS Social Insurance** (Emerytalne, Rentowe, Chorobowe) and the **Health Insurance** (Składka Zdrowotna).
    * The engine must demonstrate that during a "holiday month," the net income may become negative if fixed costs exceed the prorated revenue.
* **Tax Base Recalculation:**
    * For **Tax Scale (Skala Podatkowa)** and **Flat Tax (Podatek Liniowy)**, the reduced revenue lowers the taxable base, potentially keeping the user in a lower tax bracket for longer.
    * For **Lump Sum (Ryczałt)**, the tax is applied only to the generated revenue, but the health insurance base (based on annual revenue tiers: 60k, 300k+) may shift due to the holiday-induced revenue drop.
* **Effective Rate Calculation:**
    * The engine calculates the "Real Hourly/Daily Rate" by taking the `Total Annual Net Profit / Standard Billable Days`. This shows the user how much they must "over-earn" during working days to cover the unpaid leave.



## 4. Output & Reporting Metrics
| Output Metric | Description |
| :--- | :--- |
| Adjusted Monthly Net | The estimated take-home pay for the month(s) where the holiday is taken, after taxes and ZUS. |
| Total Annual Opportunity Cost | The gross amount of revenue "lost" by not working during the specified holiday period. |
| Real Daily Rate | The net profit per day worked, adjusted for the cost of maintaining the business during leave. |
| Break-even Buffer | The amount of additional revenue needed per working month to maintain a target net income despite the holiday. |

## 5. Business Rules & Constraints
* **ZUS Constancy Rule:** The system must not automatically reduce ZUS contributions during unpaid holidays. In Poland, social security is paid in full for any month where business activity is not officially suspended at the CEIDG office.
* **Public Holiday Overlap:** The engine must validate that unpaid holiday days do not overlap with statutory Polish public holidays (e.g., Easter, Christmas) already excluded from the working calendar, to prevent double-counting.
* **Health Insurance Tiers (Ryczałt):** If the user is on the Lump Sum (Ryczałt) tax, the mechanism must trigger a warning if the unpaid leave drops the annual revenue below a threshold (60,000 PLN or 300,000 PLN), as this significantly changes the monthly health insurance cost.
* **Negative Income Scenario:** If "Unpaid Holiday Days" in a single month result in $0$ revenue, the system must show a negative "Net Income" for that month, representing the out-of-pocket payment required for ZUS and fixed expenses.
* **Sick Leave Distinction:** This mechanism must be functionally separate from "Sick Leave" (Chorobowe), which involves ZUS payouts (zasiłek) if the contractor pays voluntary sickness insurance.
* 
