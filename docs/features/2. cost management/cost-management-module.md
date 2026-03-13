# Functional Specification: Cost Management Module

## 1. Executive Summary
The Cost Management Module is a core component of the B2B Calculator designed to allow independent contractors (JDG) to input their business expenses and accurately project their impact on net profitability. By capturing varying business costs (e.g., software, accounting, vehicle leasing), the module dynamically calculates the corresponding reductions in income tax (PIT) bases, health insurance (składka zdrowotna) bases, and VAT liabilities. Its primary business value lies in providing the user with a precise "take-home pay" projection by simulating the highly specific mechanics of Polish tax law across different taxation forms.

## 2. Input & Configuration Parameters

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| Cost Name / Label | Free-text string | User-friendly identifier for the expense in the summary list. |
| Net Amount | Numeric (PLN) | Serves as the baseline financial value for calculating tax base reductions and VAT returns. |
| VAT Rate | 0%, 5%, 8%, 23%, ZW (Exempt) | Determines the amount of input VAT (*VAT naliczony*) that can be deducted from the user's output VAT. |
| Cost Category / Type | Standard, Car - Mixed Use, Car - Business Use | Triggers conditional statutory tax logic (e.g., restrictions on VAT and PIT deductibility for vehicles). |

## 3. Core Functional Logic
* **Income Tax (PIT) Base Adjustment:**
    * *Tax Scale (12%/32%) & Flat Tax (19%):* The processing engine deducts the eligible net cost amount from the gross revenue to establish the taxable income base.
    * *Lump Sum (Ryczałt):* The engine bypasses net costs for income tax calculations, as the Ryczałt tax is levied on pure revenue, not income.
* **Health Contribution (Składka Zdrowotna) Adjustment:**
    * *Tax Scale & Flat Tax:* The engine links the health contribution base to the income base. Deducting costs proportionally lowers the health contribution (9% for Scale, 4.9% for Flat Tax).
    * *Lump Sum:* Costs are ignored. The engine calculates health contributions strictly based on statutory revenue tiers (under 60k PLN, 60k-300k PLN, over 300k PLN).
* **VAT Offset Workflow (VAT Naliczony vs. Należny):**
    * Calculates the VAT value of the cost based on the selected rate.
    * Subtracts this value from the user's generated output VAT, updating the net VAT payable to the Polish Tax Office (*Urząd Skarbowy*).
* **Vehicle Cost Algorithm (Edge Case Processing):**
    * If a cost is flagged as "Car - Mixed Use", the engine executes a split calculation: only 50% of the VAT is deductible. The remaining 50% non-deducted VAT is added to the net cost. Finally, only 75% of this combined amount is subtracted from the PIT tax base.
* **Net Take-Home Extrapolation:**
    * Updates the global real-time formula: `Final Net Pay = Net Revenue - Total Income Tax - Total ZUS - Health Contribution - Out-of-pocket Net Costs`.

## 4. Output & Reporting Metrics

| Output Metric | Description |
| :--- | :--- |
| Total Monthly Costs | The aggregated numerical sum of all entered net costs, displayed in the "Koszty prowadzenia działalności" summary panel. |
| Adjusted PIT Base | The recalculated financial base used for the income tax assessment, visible in the expanded detailed calculations view. |
| Deductible VAT Total | The aggregated sum of input VAT that decreases the overall monthly VAT liability. |
| Health Contribution Payable | The dynamically updated health insurance premium, reflecting the deductions applied to the income base. |
| Final Net Income (Na rękę) | The ultimate net amount remaining for the user after all taxes, ZUS, and inputted business expenses are cleared. |

## 5. Business Rules & Constraints
* **Lump Sum Overlap Rule:** If the user switches their taxation form to "Ryczałt", the system must immediately disable or nullify the impact of costs on the PIT tax base and Health Contribution calculations, while keeping the VAT deduction active (if the user is VAT-registered).
* **Health Contribution Minimum Threshold:** Under the Tax Scale and Flat Tax, high costs can reduce the income base to zero or create a loss. The system must enforce a hard constraint: the health contribution cannot drop below the statutory monthly minimum (currently calculated as 9% of the national minimum wage).
* **Zero-Floor Tax Base:** Monthly income tax liability cannot be negative. If total costs exceed revenue in a given month, the system must cap the monthly income tax deduction at zero (loss-carryforward logic is typically out of scope for a monthly simulator, but the immediate tax payable must not show as a negative payout from the government).
* **VAT Registration Dependency:** Input VAT from costs can only offset Output VAT if the user has selected a VAT rate on their revenue (implying they are an active VAT payer). If revenue is set to "bez VAT" (VAT exempt), cost VAT is entirely added to the gross out-of-pocket expense.
