---
name: Technical Diagramming System
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#383939'
  surface-container-lowest: '#0d0e0f'
  surface-container-low: '#1b1c1c'
  surface-container: '#1f2020'
  surface-container-high: '#292a2a'
  surface-container-highest: '#343535'
  on-surface: '#e3e2e2'
  on-surface-variant: '#c1c6d7'
  inverse-surface: '#e3e2e2'
  inverse-on-surface: '#303031'
  outline: '#8b90a0'
  outline-variant: '#414754'
  surface-tint: '#aec6ff'
  primary: '#aec6ff'
  on-primary: '#002e6b'
  primary-container: '#0070f3'
  on-primary-container: '#ffffff'
  inverse-primary: '#0059c5'
  secondary: '#c6c6c6'
  on-secondary: '#303030'
  secondary-container: '#474747'
  on-secondary-container: '#b5b5b5'
  tertiary: '#ffb596'
  on-tertiary: '#581e00'
  tertiary-container: '#ca4e00'
  on-tertiary-container: '#fffeff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#aec6ff'
  on-primary-fixed: '#001a43'
  on-primary-fixed-variant: '#004397'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1b1b1b'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#121414'
  on-background: '#e3e2e2'
  surface-variant: '#343535'
typography:
  h1:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  h2:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.02em
  body-base:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-mono:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  diagram-text:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  sidebar-width: 240px
  toolbar-height: 48px
  gutter: 16px
---

## Brand & Style

This design system is built for technical precision, catering to engineers and architects who require a high-performance environment for structural modeling. The brand personality is hyper-focused, utilitarian, and sophisticated, mirroring the aesthetic of modern developer platforms. 

The visual style is **Extreme Minimalism**. It prioritizes content density and legibility through a reduced color palette and a disciplined grid. By removing visual noise like gradients and heavy shadows, the system ensures that the complexity of Chen notation diagrams remains the focal point. The emotional response is one of clarity, speed, and reliability.

## Colors

The palette is strictly monochromatic, punctuated only by a vibrant blue for interaction states and primary calls to action. 

In **Light Mode**, surfaces are pure white to maximize the "paper" feel for diagramming. Borders use a subtle gray to define architecture without creating visual clutter. 

In **Dark Mode**, the system shifts to pitch black backgrounds. This high-contrast environment reduces eye strain during long technical sessions and makes the vibrant blue actions pop with clinical precision. Text transitions to a crisp white, ensuring maximum readability against the void.

## Typography

This design system utilizes **Geist**, a typeface designed for technical environments. It provides the clean, geometric structure required for a Vercel-inspired aesthetic. 

The typographic hierarchy is dense and compact. Tight tracking (letter-spacing) is applied to headings to create a modern, "locked-in" appearance. Labels for Chen notation shapes use a medium weight to maintain legibility even when elements are scaled down on a large canvas.

## Layout & Spacing

The layout follows a **Fixed Sidebar/Fluid Canvas** model. The sidebar and toolbars occupy fixed dimensions to provide a stable frame for the diagramming area, which expands to fill all remaining viewport space.

The spacing rhythm is based on a 4px baseline unit. This allows for tight alignment of technical panels and inspector menus. Elements within the diagram area are placed on a 10px or 20px grid for alignment precision, while UI components utilize 8px and 16px increments for consistent vertical rhythm.

## Elevation & Depth

This design system avoids traditional drop shadows in favor of **Low-Contrast Outlines**. Depth is communicated through 1px borders and subtle tonal shifts between the background and container surfaces.

- **Level 0 (Canvas):** Pure black (Dark) or Pure white (Light).
- **Level 1 (Sidebars/Panels):** Defined by a 1px border.
- **Level 2 (Modals/Popovers):** A slightly lifted effect is achieved by adding a 1px border that is one shade lighter (in Dark Mode) or darker (in Light Mode) than the background, paired with a very subtle, transparent ambient glow (0px 4px 12px rgba(0,0,0,0.1)).

## Shapes

The shape language is primarily **Soft** (0.25rem/4px), providing a slight humanist touch to an otherwise clinical system. 

For the Chen notation diagramming elements:
- **Entities:** Rectangles with sharp or 2px slightly rounded corners to indicate rigidity.
- **Relationships:** Clean, 1px diamonds.
- **Attributes:** Ovals with perfectly smooth curves.
- **Connections:** Straight 1px lines without smoothing, emphasizing the technical nature of the connections.

## Components

### Buttons
- **Primary:** Background #0070F3, Text #FFFFFF. No border.
- **Secondary:** Background transparent, Border 1px (#333333 / #EAEAEA), Text remains Foreground.
- **Tertiary/Ghost:** No background or border. Text #888888, turns Foreground on hover.

### Tooling & Inputs
- **Inputs:** 1px border. Focus state removes the border and applies a 1px blue ring.
- **Toolbar Icons:** 20px icons centered in 32px square hit areas. Active tools use the Primary Blue color.

### Diagram Elements
- **Entity Shape:** 1px border, transparent background. Text is centered horizontally and vertically.
- **Relationship Shape:** 1px border. Diamond points must align to the grid.
- **Attribute Shape:** 1px border. Connected to entities via a simple 1px line.

### Cards & Panels
- Navigation and inspector panels use a "Section" approach rather than cards. No shadows; separation is achieved through 1px horizontal or vertical dividers.