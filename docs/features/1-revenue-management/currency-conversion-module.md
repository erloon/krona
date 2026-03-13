# Functional Specification: Currency Conversion Module

## 1. Executive Summary
The Currency Conversion Module within the Kalkulator B2B application enables independent contractors (JDG) to input their monthly or hourly revenue in major foreign currencies (USD, EUR, GBP, CHF) and automatically translates it into Polish Złoty (PLN). Since Polish tax law strictly requires all statutory deductions—including Personal Income Tax (PIT), Value Added Tax (VAT), and Social Security (ZUS) contributions—to be calculated and settled in PLN, this module acts as a critical intermediary. It allows users working with international clients to accurately project their actual PLN take-home pay and tax liabilities without needing to manually convert exchange rates prior to using the calculator.

## 2. Input & Configuration Parameters

| Configuration Option | Available Values / Settings | Functional Impact |
| :--- | :--- | :--- |
| **Base Currency** | PLN, USD, EUR, GBP, CHF | Defines the currency of the raw revenue input. Selecting a foreign currency activates the exchange rate multiplier. |
| **Revenue Amount** | Numeric Value (> 0) | The gross/net amount earned in the selected base currency (can be per month, per day, or per hour). |
| **Exchange Rate** | System-defined multipliers (e.g., USD: 3.6870, EUR: 4.2629, GBP: 4.9393, CHF: 4.7357) | Serves as the conversion factor to translate the foreign currency input into the PLN equivalent. |

## 3. Core Functional Logic
* **Immediate Conversion Engine:** Upon entering an amount and selecting a non-PLN currency, the system immediately calculates the PLN equivalent using the formula: `PLN Revenue = Foreign Currency Amount × Exchange Rate`.
* **Multi-Source Aggregation:** If a user configures multiple revenue streams (e.g., Source 1 in USD, Source 2 in EUR), the module individually converts each stream into PLN and aggregates them to form the Total Monthly Revenue in PLN.
* **Downstream Data Flow:** The converted PLN total is directly injected into the core tax calculation engine. It becomes the basis for calculating:
  * Health Contribution (Składka Zdrowotna), which is highly dependent on the PLN income level under the Polish Deal (Polski Ład).
  * Income Tax brackets and limits (e.g., the 120,000 PLN threshold for the tax scale, or the 2M EUR limit for Lump Sum/Ryczałt).
* **Hourly/Daily Rate Normalization:** If the user inputs an hourly or daily rate in a foreign currency along with the number of hours/days, the module first calculates the total monthly revenue in the foreign currency, and then applies the conversion rate to find the PLN monthly revenue.

## 4. Output & Reporting Metrics

| Output Metric | Description |
| :--- | :--- |
| **Exchange Rate Display** | A UI element indicating the exact conversion rate being applied (e.g., "USD - 1 = 3.6870 PLN"), ensuring transparency for the user's calculations. |
| **Total Converted Revenue (PLN)** | The overall gross or net revenue displayed in the top summary banner, standardizing all foreign inputs into a single PLN metric. |
| **Statutory Obligations (PLN)** | Values for PIT, VAT, ZUS, and Health Contributions are output strictly in PLN based on the converted revenue base. |
| **Net Income (PLN)** | The final monthly take-home pay, rendered exclusively in PLN, factoring in all converted revenues and PLN-based business costs. |

## 5. Business Rules & Constraints
* **Statutory Currency Mandate:** All backend calculations for taxes and ZUS *must* process in PLN. The system strictly prevents tax thresholds from being evaluated against foreign currency totals.
* **Exchange Rate Volatility vs. Estimation:** The calculator utilizes static, point-in-time exchange rates for estimation purposes. It must operate under the constraint that these are approximations; Polish law dictates that actual tax obligations must use the average exchange rate announced by the National Bank of Poland (NBP) on the last business day preceding the day the revenue was generated.
* **VAT on Foreign Services:** Users inputting foreign currencies typically provide cross-border B2B services. The module assumes that the user will configure the VAT setting correctly (e.g., selecting 0% or "NP" for reverse charge), as applying standard 23% domestic VAT to a converted USD/EUR invoice may not reflect the standard export reality.
* **Cost Subtraction Rule:** Business costs are subtracted from the *converted* PLN revenue total, not the foreign currency base, maintaining consistent units across the application's ledger.
