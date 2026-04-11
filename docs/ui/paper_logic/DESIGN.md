# Design System Document: The Editorial Calculator

## 1. Overview & Creative North Star
### Creative North Star: "The Architectural Ledger"
This design system rejects the "app-like" fatigue of heavy shadows and aggressive rounded corners. Instead, it draws inspiration from high-end architectural journals and precision Swiss typography. It treats the mobile screen not as a digital interface, but as a piece of premium, tactile paper. 

To break the "template" look, we utilize **Intentional Asymmetry**. Large-scale typography is often offset, and data visualizations bleed to the edges of the screen, creating a sense of "infinite canvas." We move beyond the grid by using white space as a structural element—breathing room is not "empty," it is functional.

---

## 2. Colors & Surface Philosophy
The palette is rooted in warm neutrals to reduce eye strain and establish a professional, "workspace" atmosphere.

### The "No-Line" Rule
Standard 1px solid borders are prohibited for sectioning content. To separate data sets or calculator modules, use **tonal shifts**. A module should be defined by placing a `surface-container-low` container against a `surface` background. The eye should perceive a change in depth through color, not a "stroke."

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked vellum sheets.
- **Base Layer:** `surface` (#faf9f8)
- **Primary Content Area:** `surface-container-lowest` (#ffffff)
- **Secondary Utility/Navigation:** `surface-container` (#efeeed)
- **Nested Detail/Input Fields:** `surface-container-high` (#e9e8e7)

### The "Glass & Soul" Rule
For floating action buttons or modal overlays, use **Glassmorphism**. Apply `surface_container_lowest` at 80% opacity with a `20px` backdrop blur. This allows the calculator’s data to "ghost" through the interface, maintaining context. For primary CTAs, use a subtle vertical gradient from `primary` (#005db2) to `primary_container` (#0075de) to provide a soft, light-source effect.

---

## 3. Typography: The Editorial Voice
Typography is the primary vehicle for the brand’s authority. We use a customized scale that prioritizes legibility in complex B2B calculations.

- **Display & Headlines:** Use **Inter**. For `display-lg` through `headline-sm`, apply a letter-spacing of `-0.02em`. This "tight" setting mimics premium print editorial.
- **Numerical Data:** Use `title-lg` for calculation results. Numbers should always feel prominent and uncrowded.
- **Labels:** `label-md` and `label-sm` use `on_surface_variant` (#414753). They should feel like "annotations" on a ledger—clear but secondary.

---

## 4. Elevation & Depth
We eschew the "Material" look for **Ambient Tonal Layering**.

- **The Layering Principle:** Depth is achieved by nesting. A `surface-container-lowest` card sits atop a `surface-container-low` background. The contrast is subtle (less than 2%), providing a sophisticated "lift."
- **Ambient Shadows:** Only use shadows for high-priority floating elements. Use a multi-layered approach:
  - *Layer 1:* 0px 2px 4px rgba(26, 28, 28, 0.04)
  - *Layer 2:* 0px 12px 24px rgba(26, 28, 28, 0.06)
- **The "Ghost Border":** For input fields where definition is legally or functionally required, use `outline_variant` at **15% opacity**. It should feel like a "whisper" of a line.

---

## 5. Components

### Buttons
- **Primary:** High-contrast `primary` background with `on_primary` text. `0.375rem` (md) radius. No shadow; use the tonal gradient mentioned in Section 2.
- **Secondary:** `surface-container-highest` background. Text in `on_secondary_fixed`.
- **Tertiary (Ghost):** No background. Text in `primary`. Use for low-emphasis actions like "Clear All."

### Calculator Inputs
- **Text Fields:** Forgo the traditional "box." Use a `surface-container-low` background with a `0.25rem` radius. On focus, shift the background to `surface-container-lowest` and apply a `1px` Ghost Border in `primary`.
- **Keypads:** Use a flat grid. Keys are separated by white space (gutter: 8px), not lines. Use `title-md` for digits.

### Chips & Tags
- **Selection Chips:** Use `secondary_container` with `on_secondary_container` text. These should look like small pieces of taped-on paper.

### Cards & Lists
- **The "No-Divider" Rule:** Never use a horizontal line to separate list items. Use 16px of vertical padding and a subtle background hover state (`surface-container-high`) to define the hit area.

### Tooltips
- Minimalist blocks of `inverse_surface` with `inverse_on_surface` text. No "beak" or "tail" on the tooltip; use simple rectangular geometry.

---

## 6. Do's and Don'ts

### Do
- **Do** use asymmetrical margins. If the left margin is 24px, try a right margin of 32px for detail views to create an editorial feel.
- **Do** use "Notion Blue" (`primary_container`) sparingly as a precise "laser" to guide the user's eye to the final calculation.
- **Do** prioritize the "Paper" feel. If a layout feels too digital, increase the warm neutral saturation.

### Don't
- **Don't** use 100% black. Always use `on_surface` (#1a1c1c) for text to maintain the soft-ink-on-paper look.
- **Don't** use "Card Shadows" for every list item. This creates visual clutter. Use tonal shifts instead.
- **Don't** use high-radius "pill" shapes for buttons unless they are floating action buttons. Stick to the `md` (0.375rem) or `lg` (0.5rem) scale for a professional B2B tone.