# Functional Specification: VAT Calculation Logic (Polish B2B Context)

## 1. Executive Summary
The VAT Calculation Logic is a core module of the B2B calculator designed to manage Value Added Tax (VAT/PTU) implications for self-employed individuals (Sole Proprietorships) in Poland. Its primary purpose is to distinguish between "Netto" (net revenue) and "Brutto" (gross revenue including VAT) amounts, calculate the VAT liability to be paid to the Tax Office (US), and account for VAT-deductible business expenses. This logic ensures the user understands their real cash flow, separating tax collected on behalf of the state from actual business income.

## 2. Input & Configuration Parameters
| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **VAT Status** | Active (Active VAT payer) / Exempt (Zwolniony z VAT) | Determines if the system adds 23% (or other rates) to the base invoice amount and allows for cost deductions. |
| **VAT Rate (Output)** | 23%, 8%, 5%, 0%, NP, Exempt | Sets the tax rate applied to the issued invoices. Default is 23% for most B2B services (IT/Consulting). |
| **Business Expenses (Brutto/Netto)** | Numerical Value + VAT Rate selection | Calculates the "Input VAT" (VAT naliczony) which reduces the final VAT obligation to the Tax Office. |
| **Monthly/Quarterly Settlement** | Monthly / Quarterly | Defines the frequency of VAT-7 (JPK_V7) reporting and payment deadlines. |

## 3. Core Functional Logic
The VAT engine operates on the principle of neutrality for the entrepreneur, acting as an intermediary between the client and the tax authority.

* **Gross Revenue Calculation (Output VAT):**
    * Formula: `Netto Amount * (1 + VAT Rate) = Brutto Amount`.
    * The "Output VAT" (VAT należny) is the amount the user charges their client.
* **Expense VAT Deduction (Input VAT):**
    * For every business cost entered, the system identifies the VAT component: `Cost Netto * VAT Rate = Input VAT`.
    * Logic handles partial deductions (e.g., 50% VAT deduction for mixed-use passenger vehicles according to Polish tax law).
* **VAT Settlement Logic:**
    * The system calculates the final payable VAT: `Total Output VAT - Total Input VAT = VAT to Pay`.
    * If Input VAT > Output VAT, the system indicates a VAT surplus (to be carried over to the next period or refunded).
* **Interaction with Personal Income Tax (PIT):**
    * The logic ensures that PIT (Tax Scale, Flat Tax, or Lump Sum/Ryczałt) is calculated **only** on the Netto amount (Revenue minus Netto Costs), as VAT is transparent to income tax.
    * Exception: For VAT-exempt taxpayers, the "Brutto" cost becomes the "Netto" cost for PIT purposes.



## 4. Output & Reporting Metrics
| Output Metric | Description |
| :--- | :--- |
| **Total Output VAT** | The sum of VAT added to all outgoing invoices in the settlement period. |
| **Total Input VAT** | The sum of VAT recovered from business-related purchases/expenses. |
| **VAT Payable (Do zapłaty)** | The final amount to be transferred to the Individual Tax Micro-account. |
| **Real Monthly Income (Netto po opodatkowaniu)** | The "Bottom Line" figure—Total Netto Revenue minus Social Security (ZUS), Income Tax (PIT), and Netto Costs. |

## 5. Business Rules & Constraints
* **Standard Rate Default:** The system defaults to 23% as the standard rate for B2B services in Poland (e.g., Software Development).
* **Car Expense Rule:** Logic must automatically apply the 50% VAT deduction limit for fuel and vehicle overheads if the car is registered for "Mixed Use" (private and business), while maintaining 100% deduction for "Business Only" usage.
* **VAT Exemption Threshold:** The system should provide a warning or toggle for the statutory limit (currently 200,000 PLN per annum). If revenue exceeds this, VAT registration becomes mandatory.
* **Reverse Charge (Odwrotne Obciążenie):** For international B2B services (EU/Non-EU), the system must allow for "NP" (Not Taxable in Poland) or 0% rates, shifting VAT responsibility to the buyer (Reverse Charge).
* **Rounding Rules:** In accordance with the Polish Tax Ordinance (Ordynacja podatkowa), the final VAT amount payable to the Tax Office must be rounded to the nearest full Polish Zloty (PLN).
