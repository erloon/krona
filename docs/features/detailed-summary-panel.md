### 2.6 Deep Dive: Detailed Summary Panel ("Szczegółowe podsumowanie")

**Overview:**
The Detailed Summary Panel is a collapsible UI component that provides transparency. While the top dashboard shows the final net amount, this panel acts as an accounting ledger, displaying the step-by-step mathematical derivation: Gross Revenue -> Net Revenue -> Deductible Costs -> ZUS Contributions -> Health Base -> Health Contribution -> Tax Base -> Income Tax -> Final Net.

**Functional Mechanics:**
1. **Expand/Collapse Toggle:** A UI interaction to reveal or hide the granular breakdown.
2. **Sequential Display:** The data is presented in the exact chronological order dictated by Polish tax law, making it easy for an accountant to verify.
3. **Dynamic Rendering:** Rows only appear if they are mathematically relevant. For instance, if the user has no business costs, the "Costs deduction" row might be hidden or show 0.00 to avoid clutter.

**Edge Cases to Test:**
* **Floating Point Precision (Rounding Errors):** The detailed steps must mathematically sum up perfectly to the final net income displayed at the top. JavaScript floating-point errors (e.g., `0.1 + 0.2 = 0.30000000000000004`) must be strictly handled using appropriate currency rounding libraries (e.g., rounding to 2 decimal places at each statutory step).
* **Negative Tax Base:** If a user enters business costs that exceed their revenue (generating a business loss), the calculation for Income Tax and Health Contribution must floor at 0.00 PLN (or the statutory minimum health contribution), rather than showing a negative tax liability.
* **Annual Bracket Crossing (Tax Scale):** The detailed summary must clearly indicate if the monthly average pushes the user into the higher 32% tax bracket (over 120,000 PLN annually), showing a blended tax rate or explicitly stating the assumption used for the monthly view.
  
