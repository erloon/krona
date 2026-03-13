### 2.3 Deep Dive: Tax & Deduction Engine (Core Logic)

**Overview:**
This is the central processing unit of the application. It takes the aggregated normalized revenue, subtracts the aggregated costs (if applicable), and applies Polish tax law algorithms to calculate social security (ZUS), health contributions (Składka zdrowotna), and income tax (PIT).

**Functional Mechanics:**

1.  **ZUS (Social Security) Calculation:**
    * The engine evaluates the "ZUS - Ubezpieczenie społeczne" setting selected by the user.
    * **Tiers:** It applies fixed statutory rates for:
        * *Ulga na start* (Health contribution only, for the first 6 months).
        * *Składka preferencyjna* (Reduced ZUS for the next 24 months, based on 30% of minimum wage).
        * *Brak ulgi / Standardowy ZUS* (Standard ZUS, based on 60% of projected average wage).
        * *Umowa o pracę* (Only health contribution applies if the user earns at least minimum wage on a concurrent employment contract).
    * **Voluntary Sickness Insurance:** A toggle allows users to add or remove the sickness insurance (ubezpieczenie chorobowe) from the total ZUS burden.

2.  **Health Contribution (Składka Zdrowotna) Calculation:**
    * The logic here dynamically changes based on the selected tax form:
        * *Tax Scale (Skala podatkowa):* 9% of the real income (Revenue - Costs - ZUS).
        * *Flat Tax (Podatek liniowy):* 4.9% of the real income.
        * *Lump Sum (Ryczałt):* A fixed flat rate depending on the annual revenue tier (Up to 60k PLN, 60k-300k PLN, Over 300k PLN). The calculator projects the monthly revenue into an annual bracket to estimate this.

3.  **Income Tax (PIT) Calculation:**
    * The engine determines the tax base: `(Total Revenue - Total Costs - ZUS Contributions)`.
    * **Tax Scale:** Applies the 12% rate (up to 120,000 PLN) and 32% (above 120,000 PLN), factoring in the tax-free allowance (kwota wolna od podatku).
    * **Flat Tax:** Applies a strict 19% rate to the tax base.
    * **Lump Sum:** Applies the specific percentage rate chosen by the user (typically via a dropdown or input field, e.g., 12%, 8.5%, 5.5%).

4.  **Reliefs and Modifiers:**
    * **IP BOX:** If toggled, reduces the income tax rate to 5% for eligible intellectual property income.
    * **Joint Taxation / Return Relief:** Adjusts the tax-free allowance or tax brackets according to specific statutory rules.
