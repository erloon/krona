# Functional Specification: Family Relief Logic (Ulga dla rodzin 4+)

## 1. Executive Summary
The Family Relief (PIT-0 dla rodzin 4+) functionality is a crucial tax calculation module within the B2B calculator that applies specific Polish tax code exemptions for entrepreneurs raising four or more children. Its core purpose is to accurately simulate the exemption of up to 85,528 PLN of annual income (or revenue) from income tax. This feature delivers significant business value by providing contractors with an exact projection of their increased net take-home pay, ensuring the calculator remains compliant with the Polish Deal (Polski Ład) legislative framework.

## 2. Input & Configuration Parameters

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| Family Relief 4+ Toggle (Ulga dla rodzin 4+) | `Yes` / `No` (Checkbox/Toggle) | Triggers the inclusion of the 85,528 PLN tax exemption limit into the annual income tax calculation algorithms. |
| Taxation Form (Forma opodatkowania) | `Tax Scale` (Skala), `Flat Tax` (Liniowy), `Lump Sum` (Ryczałt) | Determines the baseline tax rate applied to the income that exceeds the family relief threshold. |

## 3. Core Functional Logic
The processing engine for the Family Relief logic alters the standard path of Income Tax (PIT) calculation. The workflow operates as follows:

* **Exemption Threshold Tracking:** The system monitors the cumulative annual income (for Tax Scale/Flat Tax) or revenue (for Lump Sum). 
* **Tax Base Reduction:**
    * If the toggle is activated, the first 85,528 PLN earned in the fiscal year is completely exempted from income tax calculations.
    * The calculator deducts this exemption from the monthly tax base progressively until the 85,528 PLN limit is fully exhausted.
* **Interaction with Standard Tax-Free Allowance (Kwota wolna od podatku):**
    * If the user selects the "Tax Scale" (Zasady ogólne), the standard 30,000 PLN tax-free allowance is applied *in addition* to the family relief. This effectively shifts the tax threshold to 115,528 PLN.
    * For Flat Tax and Lump Sum, the standard 30k allowance does not apply, but the 85,528 PLN family relief remains valid.
* **Health Insurance Independence:** The logic explicitly excludes Health Insurance (Składka zdrowotna) from this exemption. Health contributions continue to be calculated based on the actual income/revenue according to the selected taxation form, ignoring the PIT-0 exemption.

## 4. Output & Reporting Metrics

| Output Metric | Description |
| :--- | :--- |
| Income Tax (Zaliczka na PIT) | The monthly and annual income tax amounts, which will display as 0 PLN until the cumulative income/revenue exceeds the 85,528 PLN limit (or 115,528 PLN on Tax Scale). |
| Net Income (Na rękę) | The final monthly and annual take-home pay, which will be proportionally higher during the months the relief is actively shielding income from taxation. |
| Effective Tax Rate | The overall percentage of tax paid over the year, which will visibly decrease as a result of the zero-tax bracket applied by this feature. |

## 5. Business Rules & Constraints
* **Statutory Limit:** The maximum relief amount is strictly capped at 85,528 PLN per calendar year. Once this threshold is crossed in a given month, the surplus is taxed at the applicable standard rates.
* **Applicability Constraint:** The relief applies *only* to income tax (PIT). It does not exempt the user from paying Social Security contributions (ZUS Społeczne) or Health Insurance (ZUS Zdrowotne).
* **Proration Rule:** In a monthly breakdown view, the system must exhaust the limit sequentially. For example, if monthly income is 20,000 PLN, months 1-4 will have 0 PLN income tax, month 5 will have partial tax applied to the excess over 85,528 PLN, and months 6-12 will be fully taxed.
* **Tax Form Compatibility:** The relief is legally valid and must be calculable across all three main B2B taxation forms (Tax Scale, Flat Tax, and Lump Sum).
  
