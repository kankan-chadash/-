---
name: The Scholar's Study
colors:
  surface: '#fff8f6'
  surface-dim: '#ffd0bf'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1ec'
  surface-container: '#ffe9e3'
  surface-container-high: '#ffe2d9'
  surface-container-highest: '#ffdbcf'
  on-surface: '#2e150b'
  on-surface-variant: '#504442'
  inverse-surface: '#46291e'
  inverse-on-surface: '#ffede7'
  outline: '#827471'
  outline-variant: '#d4c3bf'
  surface-tint: '#755750'
  primary: '#361f1a'
  on-primary: '#ffffff'
  primary-container: '#4e342e'
  on-primary-container: '#c19c94'
  inverse-primary: '#e5beb5'
  secondary: '#5e604d'
  on-secondary: '#ffffff'
  secondary-container: '#e1e1c9'
  on-secondary-container: '#636451'
  tertiary: '#735c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cca830'
  on-tertiary-container: '#4f3e00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad2'
  primary-fixed-dim: '#e5beb5'
  on-primary-fixed: '#2b1611'
  on-primary-fixed-variant: '#5c403a'
  secondary-fixed: '#e4e4cc'
  secondary-fixed-dim: '#c8c8b0'
  on-secondary-fixed: '#1b1d0e'
  on-secondary-fixed-variant: '#474836'
  tertiary-fixed: '#ffe088'
  tertiary-fixed-dim: '#e9c349'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#fff8f6'
  on-background: '#2e150b'
  surface-variant: '#ffdbcf'
typography:
  display-lg:
    fontFamily: EB Garamond
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
  title-md:
    fontFamily: EB Garamond
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
  body-md:
    fontFamily: Source Sans 3
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Source Sans 3
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  margin-page: 32px
  gutter-text: 24px
  desktop-max-width: 1280px
---

## Brand & Style
The design system is centered on the concept of "The Scholar's Study Table," evoking the focused, warm, and timeless atmosphere of a traditional Bet Midrash (Study Hall). The target audience includes serious students of Jewish texts who seek a digital environment that honors the weight and history of the Gemara while providing modern functional clarity.

The style is a sophisticated blend of **Tactile/Skeuomorphism** and **Minimalism**. It utilizes material textures—specifically aged paper and polished wood—to create a sense of physical presence. The emotional response is one of intellectual calm, reverence, and hospitality. UI elements are treated as physical objects on a desk: windows behave like open volumes, sidebars like margins, and notifications like bookmarks.

## Colors
The palette is rooted in the natural materials of a traditional library. 
- **Primary (Walnut):** Used for structural navigation, heavy headers, and "closed book" states. It provides the grounding weight of a study table.
- **Secondary (Parchment):** The primary surface color for reading areas. It reduces eye strain compared to pure white and mimics the texture of aged paper.
- **Tertiary (Gold Leaf):** Reserved for highlights, active states, and decorative flourishes that signify importance or "Kodesh" (holiness).
- **Neutral (Leather):** Used for secondary controls, dividers, and subtle borders.

## Typography
The typography strategy mimics the hierarchy of a printed Vilna Shas. 
- **Headings:** Use **EB Garamond** for its literary, historical elegance. It feels authoritative yet graceful. High-level headers should use title-case or sentence-case, never all-caps.
- **Body Text:** Use **Source Sans 3** for the primary commentary and interface text. It provides a clean, modern contrast to the serif headings, ensuring that long-form study remains legible on digital screens.
- **Hebrew Support:** For Hebrew text (Gemara/Mishna), utilize a traditional serif font like **Frank Ruhl Libre** (system fallback) to maintain the "Tzurah" (shape) of the page, ensuring it is rendered slightly larger than the English text to account for x-height differences.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy, centered on the screen like a book laid open on a desk. 
- **The "Daf" (Page) Container:** The main content area is constrained to a maximum width of 1280px to maintain line-length readability.
- **Gutter Philosophy:** Wide margins (32px+) are encouraged to mimic the look of traditional manuscripts where marginalia (commentary) resides.
- **Responsive Behavior:** On mobile, the "wood" background of the desk is hidden, and the "parchment" paper expands to fill the screen, using a 16px margin to maximize the study area.

## Elevation & Depth
Depth is created through **Tonal Layers** and **Ambient Shadows** that suggest physical thickness:
- **Level 0 (The Table):** The base background is a dark, textured wood (`#4E342E`).
- **Level 1 (The Sheet):** The main content area uses a soft parchment color with a very subtle 1px inner stroke of a slightly darker tan to suggest the edge of a page.
- **Level 2 (The Volume):** Active cards or "open" sections use a soft, diffused shadow (12px blur, 10% opacity, tinted with `#2C1E1B`) to appear lifted off the table.
- **Level 3 (The Bookmark):** Popovers and modals use sharper shadows and a Gold accent top-border to indicate they are temporary overlays placed atop the books.

## Shapes
This design system uses **Soft** roundedness. While books have slightly rounded corners from wear, the layout remains structured. 
- **Cards and Inputs:** Use a 4px (0.25rem) radius.
- **Buttons:** Follow the 4px radius unless they are "Bookmark" style actions, which are straight-edged on three sides and pointed or tabbed on one.
- **Dividers:** Use organic, slightly tapered lines or "dot" flourishes rather than harsh solid lines to separate sections of text.

## Components
- **Buttons:** Primary buttons are dark wood (`#4E342E`) with Gold (`#D4AF37`) text. They should have a subtle "pressed" effect (inner shadow) rather than a color change.
- **Chips (Topics/Tags):** Designed to look like small leather-bound labels or paper scraps. Use a light tan background with a thin `#795548` border.
- **Input Fields:** Styled as underlined "blanks" or boxed areas with a background color slightly darker than the parchment (`#FFF8E1`). The focus state is a Gold bottom border.
- **Cards (Commentary):** These represent individual sections of text. They should have a "deckled edge" visual treatment or a simple subtle shadow to distinguish them from the main page background.
- **The "Bookmark" Tab:** Use a vertical Gold ribbon component for primary navigation or "Save for Later" features. It should hang from the top of the container.
- **Lists:** Traditional bullet points are replaced with small diamond shapes or Hebrew letters in Gold.