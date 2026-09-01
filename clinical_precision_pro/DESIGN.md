---
name: Clinical Precision Pro
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#42474f'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#727780'
  outline-variant: '#c2c7d1'
  surface-tint: '#2d6197'
  primary: '#00355f'
  on-primary: '#ffffff'
  primary-container: '#0f4c81'
  on-primary-container: '#8ebdf9'
  inverse-primary: '#a0c9ff'
  secondary: '#006875'
  on-secondary: '#ffffff'
  secondary-container: '#00e3fd'
  on-secondary-container: '#00616d'
  tertiary: '#313436'
  on-tertiary: '#ffffff'
  tertiary-container: '#474b4d'
  on-tertiary-container: '#b8bbbc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#a0c9ff'
  on-primary-fixed: '#001c37'
  on-primary-fixed-variant: '#07497d'
  secondary-fixed: '#9cf0ff'
  secondary-fixed-dim: '#00daf3'
  on-secondary-fixed: '#001f24'
  on-secondary-fixed-variant: '#004f58'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-display:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  data-label:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin: 32px
  container-max: 1440px
---

## Brand & Style

This design system embodies the "Medical Command Center" aesthetic—a high-utility environment that balances clinical authority with technical sophistication. The system is designed for high-stakes healthcare environments where data clarity and emotional composure are paramount.

The design style is **Technical Minimalism** with a **Tactile Glass** influence. It utilizes a predominantly white, airy interface to reduce cognitive load, punctuated by high-precision accents and hyper-thin structural elements. The emotional response is one of "calm control," achieved through expansive whitespace, rigorous alignment, and a sophisticated light-mode transparency model.

## Colors

The palette is anchored in **Clinical Blue (#0F4C81)**, a color of institutional trust and depth. It is electrified by **Precision Cyan (#00E5FF)**, used exclusively for active states, data highlights, and "on" signals.

- **Surface Tiers:** Use `#FFFFFF` for primary work surfaces and `#F8FAFC` (Off-white) for background staging and grouping.
- **Accents:** Precision Cyan should be used sparingly—as a "glow" or a high-contrast indicator against the deep Clinical Blue.
- **Borders:** A consistent `#E2E8F0` is used for the 0.5px structural lines to maintain a "blueprint" feel without adding visual weight.

## Typography

The system utilizes a dual-font strategy. **Hanken Grotesk** provides a clean, contemporary sans-serif foundation for navigation and prose, ensuring the interface feels professional and approachable. 

**JetBrains Mono** is reserved for technical data points, status readouts, and timestamps. This monospaced font reinforces the "tactical" nature of the product, ensuring that numerical values align vertically for easy comparison across dashboards. All labels associated with metrics must use the `data-label` style to distinguish them from standard UI copy.

## Layout & Spacing

This design system uses a **Rigid Tactical Grid**. The layout is built on a 12-column system for desktop with a strict 4px baseline rhythm.

- **Airy Composition:** To prevent the "crowded" feel of traditional medical software, every module must maintain a minimum internal padding of 24px (6 units). 
- **Data Density:** While the overall layout is airy, technical data clusters can use tighter 8px (2 unit) spacing internally, provided they are surrounded by ample negative space.
- **Adaptive Reflow:** On tablet, the grid shifts to 8 columns with 16px margins. On mobile, it moves to 4 columns with 16px margins, and all `data-display` elements scale to full width to preserve legibility.

## Elevation & Depth

Depth is achieved through **Subtle Glassmorphism** rather than traditional drop shadows. This maintains the "light and airy" requirement while indicating hierarchy.

- **Layering:** Background surfaces are solid `#F8FAFC`. Active panels and modals use a semi-transparent white (`rgba(255, 255, 255, 0.7)`) with a 12px backdrop blur.
- **Borders as Depth:** Instead of heavy shadows, use 0.5px solid borders in `#E2E8F0`. For elevated states (like an active card), change the border color to Clinical Blue or Precision Cyan at 0.5px.
- **Tactile Indicators:** High-priority alerts may use a soft "inner glow" of Precision Cyan to simulate a backlit physical instrument.

## Shapes

The shape language is **Technical and Precise**. The `Soft` (0.25rem) setting is used to prevent the interface from feeling "aggressive" or "brutalist," while maintaining enough structural rigidity to feel like a high-end medical instrument. 

- **Standard Elements:** 4px radius for buttons and input fields.
- **Containers:** 8px (rounded-lg) for main data cards and dashboard modules.
- **Interactive States:** Use sharp, 90-degree corners for indicator "pills" or status tags to contrast against the soft-rounded primary containers.

## Components

- **Buttons:** Primary buttons are solid Clinical Blue with white text. Ghost buttons use the 0.5px border and JetBrains Mono for a "utility" feel.
- **Input Fields:** Minimalist design with a 0.5px bottom-border only in default state, transitioning to a full 0.5px Clinical Blue frame on focus.
- **Technical Chips:** Used for status (e.g., "STABLE", "CRITICAL"). These use JetBrains Mono, all-caps, with a faint background tint of the status color and a high-saturation 2px left-accent bar.
- **Medical Cards:** White base, 0.5px border, no shadow. Use a glass-morphic header (backdrop blur) to separate the title area from the data content.
- **Data Lists:** High-contrast row stripes using `#F8FAFC` and white. Use 0.5px horizontal dividers only. No vertical dividers between columns to maintain an airy feel.
- **Command Bar:** A floating, glass-morphic footer or header component for quick actions, using backdrop blur and Precision Cyan icons.