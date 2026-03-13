### 2.2 Deep Dive: Cost Management (Business Expenses)

**Overview:**
The Cost Management module allows users to input their monthly business expenses (e.g., leasing, accounting, software subscriptions). This is a critical feature because under certain tax regimes (Tax Scale and Flat Tax), these costs reduce the income tax base and the health contribution base, significantly impacting the final net income. 

**Functional Mechanics:**

1.  **Cost Entry and Aggregation:**
    * **Initialization:** By default, the cost section starts at 0 PLN.
    * **Addition:** Users can add multiple individual expenses by clicking the "Add cost" (Dodaj koszt) button.
    * **Summation:** The system calculates a rolling "Total Costs" (Suma kosztów) which is subtracted from the aggregated revenue.

2.  **Input Parameters per Cost Item:**
    * **Net Amount:** The base value of the expense.
    * **VAT Rate:** A dropdown (e.g., 23%, 8%, 0%) to determine how much VAT can be deducted. This interacts directly with the VAT collected from revenues, calculating the final VAT payable to the tax office (VAT należny vs. VAT naliczony).

3.  **Tax Form Dependency (Edge Case Handling):**
    * **Lump Sum (Ryczałt):** If the user selects "Ryczałt" as their tax form in the Settings Panel, the application visually or logically disables/ignores the cost section for income tax purposes, as Lump Sum taxation is calculated on gross revenue without cost deductions. Costs will only be used to calculate VAT deductions in this scenario.
