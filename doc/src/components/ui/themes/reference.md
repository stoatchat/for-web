# Reference Guide

WIP: currently undergoing some work on this...

## Colour

The following Material colour roles are accessible through the CSS variables `var(--md-sys-color-*)`:

![M3 Colour Roles](./material-colour-roles.png)

## Brand presence colour roles

The following brand presence colour roles are accessible through the CSS variables `var(--brand-presence-*)`:

| Status | CSS-Variable | Hex-Code |
| :--- | :--- | :--- |
| **Online** | `var(--brand-presence-online)` | <span style="color:#3ABF7E;font-weight:bold;">#3ABF7E</span> |
| **Idle** | `var(--brand-presence-idle)` | <span style="color:#F39F00;font-weight:bold;">#F39F00</span> |
| **Busy** | `var(--brand-presence-busy)` | <span style="color:#F84848;font-weight:bold;">#F84848</span> |
| **Focus** | `var(--brand-presence-focus)` | <span style="color:#4799F0;font-weight:bold;">#4799F0</span> |
| **Invisible** | `var(--brand-presence-invisible)` | <span style="color:#A5A5A5;font-weight:bold;">#A5A5A5</span> |

## Roundness

Border radius values are provided as `var(--borderRadius-none|xs|sm|md|lg|li|xl|xli|xxl|full|circle)`, these correspond to the corner radius scale in Material 3 expressive design.

Learn more here about how to apply the scale: https://m3.material.io/styles/shape/corner-radius-scale

## Gaps

Gap values are provided as `var(--gap-none|xxs|xs|s|sm|md|lg|x|xl|xxl)`

## Fonts

Font values are provided by:

- Primary: `var(--fonts-primary)`
- Monospace: `var(--fonts-monospace)`

## Typography

Typography tokens are currently fixed.

## Elevation

Components can use elevation to depict different degrees of importance and separation.

Usually, this is implemented by:
- Using the `scrim` colour role on a background surface (see [Colour](#Colour))
- Or adding a drop shadow to the component

Currently, our theme system only provides elevation tokens for drop shadows, while scrims uses different levels of opacity (not tokenized.)

Drop shadow tokens are available as `var(--md-sys-elevation-<level>)`, where
`<level>` is a number from `0` (lowest resting point, no drop shadow) to `5` (highest resting point).

The Material Design website has guidance on when to use drop shadows for elevation: https://m3.material.io/styles/elevation/overview

## Transitions

Two transition speeds are specified (in format, `<time> <easing>`):

- Fast: `var(--transitions-fast)`
- Medium: `var(--transitions-medium)`
