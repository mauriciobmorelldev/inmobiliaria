# Design System Specification: High-End Editorial Real Estate

## 1. Overview & Creative North Star: "The Digital Curator"
The objective of this design system is to transcend the "generic SaaS" look by adopting the DNA of high-end editorial magazines and luxury architectural portfolios. We are not just building a platform; we are creating a digital gallery where properties are the art and the UI is the sophisticated frame.

**Creative North Star: The Digital Curator**
Our design philosophy rejects the rigid, boxed-in layouts of traditional real estate portals. Instead, we embrace **Intentional Asymmetry** and **Tonal Depth**. By overlapping high-resolution imagery with sophisticated typography and floating layers, we create a sense of movement and "human" curation. The system prioritizes breathing room (whitespace) over information density, signaling to the user that their time-and their investment-is premium.

---

## 2. Colors & Surface Architecture
We utilize a sophisticated "Forest-on-Bone" palette. The foundation is a warm off-white (`surface`), providing a more organic feel than a clinical pure white.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts or subtle tonal transitions. For example, a `surface-container-low` section sitting on a `surface` background is the only way to "separate" content.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers-like stacked sheets of fine paper.
- **Background (`#fcf8f9`):** The canvas.
- **Surface-Container-Lowest (`#ffffff`):** Use for cards or elements that need to "pop" most against the background.
- **Surface-Container-High (`#eae7e8`):** Use for recessed areas like sidebars or secondary utility panels.
- **The "Glass & Gradient" Rule:** To move beyond a standard flat look, floating elements (like property filters or navigation bars) should use Glassmorphism. Apply `surface` at 80% opacity with a `24px` backdrop-blur.

### Signature Textures
Main CTAs and Hero backgrounds should utilize a subtle linear gradient (135deg): `primary` (`#07160d`) to `primary_container` (`#1b2b21`). This provides a visual "soul" and depth that flat hex codes cannot achieve.

---

## 3. Typography: The Editorial Voice
Our typography pairing is designed to feel authoritative yet accessible. We use **Manrope** for high-impact displays and **Inter** for functional clarity.

- **Display & Headlines (Manrope):** These are our "Editorial" voices. Use `display-lg` for hero property titles. The wide aperture of Manrope conveys a modern, architectural feel.
- **Titles & Body (Inter):** These are our "Functional" voices. Inter's high x-height ensures readability in complex management dashboards.
- **Hierarchy as Identity:** Always maintain a high contrast between headline sizes and body text. If a headline is `headline-lg`, the supporting text should jump down to `body-md` to create a clear, sophisticated visual anchor.

---

## 4. Elevation & Depth: Tonal Layering
We do not use shadows to create "pop"; we use them to simulate "atmosphere."

### The Layering Principle
Depth is achieved by "stacking" surface tiers. Place a `surface-container-lowest` card on a `surface-container-low` section to create a soft, natural lift.

### Ambient Shadows
When a floating effect is required (e.g., a property hover state), use **Ambient Shadows**:
- **Blur:** 40px - 60px.
- **Opacity:** 4% - 8%.
- **Color:** Use a tinted version of `on-surface` (`#1b1b1c`) rather than pure black. This mimics natural light.

### The "Ghost Border" Fallback
If a border is absolutely necessary for accessibility (e.g., input fields), use a **Ghost Border**: `outline-variant` (`#c3c8c2`) at **15% opacity**. 100% opaque borders are strictly forbidden as they break the editorial flow.

---

## 5. Component Guidelines

### Buttons: The Weighted Anchor
- **Primary:** `primary` background with `on_primary` text. Use `md` (12px) roundedness. No shadows on resting state; subtle `primary_container` glow on hover.
- **Secondary:** `surface_container_highest` background. No border. This creates a "recessed" look.
- **Tertiary:** Text-only with a 2px `primary` underline that appears only on hover.

### Cards: The Property Portfolio
- **Styling:** No borders. Use `surface_container_lowest` for the card body.
- **Image Handling:** Images must always be the hero. Use a 16:9 or 4:5 aspect ratio with `md` (12px) corner radius.
- **Spacing:** Use "Comfortable" spacing (24px - 32px internal padding) to maintain the luxury feel.

### Input Fields: Minimalist Utility
- **State:** Default state uses the "Ghost Border" (15% opacity).
- **Focus:** Transition the border to `primary` and add a subtle `primary_fixed` (light green) outer glow.
- **Labeling:** Use `label-md` in `on_surface_variant` positioned strictly above the field-never placeholder-only labels.

### Forbid: Divider Lines
Never use `<hr>` tags or border-bottoms to separate list items. Use **Vertical White Space** (e.g., 24px increments) or a alternating subtle background shift (`surface` to `surface_container_low`).

---

## 6. Do's and Don'ts

### Do:
- **Do** overlap elements. Let a property price tag (a small floating `surface_container_lowest` chip) overlap the corner of the property image.
- **Do** use extreme whitespace. If you think there is enough space, add 16px more.
- **Do** use `primary` (#07160d) for all primary text to maintain high-contrast legibility against the off-white backgrounds.

### Don't:
- **Don't** use pure black (#000000). Use `primary` or `on_surface` for deep tones.
- **Don't** use standard "Drop Shadows." Only use high-blur, low-opacity Ambient Shadows.
- **Don't** use 100% opaque borders. They create "visual noise" that contradicts the premium aesthetic.
- **Don't** cram information. If a dashboard feels crowded, move secondary data into a "Details" drawer.
