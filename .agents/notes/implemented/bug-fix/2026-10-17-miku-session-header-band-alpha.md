# Agent Note: the miku session-header band is a two-layer alpha value

Status: implemented

## Problem

`skins/miku/patches.css` paints the session header's band on
`[data-slot='conversation.header'] > header`. That band is not the only translucent
layer over the artwork: `skin.json`'s `contributes.backgroundMedia.light.scrim` puts a
near-white 0.50 -> 0.62 gradient between the illustration and everything else. A user
therefore sees `composed = 1 - (1 - scrim)(1 - band)`, and the shipped pair
`#fbfdffe0 / #fbfdffb8` (0.878 / 0.722) composed to **0.94 -> 0.86** - an opaque plate.

The host renders that header even on the empty hero screen, where it holds no title and
no tabs, so the plate covered nothing but the illustration: its 40 CSS px lower edge cut
the top of the artwork in two (issue #71).

Two independent measurements agree with that arithmetic:

- the skin's own published `preview/light.jpg` is flat near-white for rows 0..39
  (std <= 1.35, mean |dy| <= 0.9) and steps at row 40 (mean |dy| 17.7) into the
  illustration - the same 40 CSS px edge the report describes;
- rendering the served stylesheet over the shipped artwork and the manifest scrim, then
  solving the two-layer model per row, gives a composed opacity of 0.938 at the band's
  top, 0.862 at its bottom and 0.506 below it (dark: 0.861 / 0.701 against 0.117).

## Decision

Keep the design language - a translucent band plus its 1px hairline - and move the band
into the range its own comment claimed: light `#fbfdff3d` / `#fbfdff14` (0.239 / 0.078),
dark `#0e1a2b4d` / `#0e1a2b1f` (0.302 / 0.122). The composed opacity becomes
0.62 -> 0.54 over the light scrim (0.50 below the band) and 0.39 -> 0.23 over the dark
one (0.12 below). The hairline is untouched.

The dark pair looks stronger in alpha but lands on the same seam: it adds 0.113 of
opacity against the light band's 0.039, yet only ~4 luminance units against the dark
artwork's ~4 against the bright one. Alpha is not luminance, so the two themes are
matched by the rendered step, not by the stop values.

`tests/miku-patches.spec.ts` pins both gradients, the band/hairline design language, the
opacity the band may add over the scrim the manifest declares (0.125), a composed-opacity
ceiling, and the scoped selectors the skin center serves - and asserts that the shipped
pair fails those ceilings, so the guard cannot go vacuous.

## Alternatives considered

- **Drop the fill (`background: none`).** Offered in the report. Rejected: the band and
  the hairline are the skin's own design language, and a session that does show a title
  row still wants a slight lift against the illustration.
- **Hide the header when the conversation pane is empty.** Rejected: the band's lower
  edge is wrong on every screen, not just the hero one; it would hang the fix on a host
  markup detail; and [2026-09-29-display-contents-header-glass](2026-09-29-display-contents-header-glass.md)
  already showed what happens when a fill is anchored on a slot stamp (0x0 box).
- **Lower the scrim instead.** Rejected here: that re-washes the whole illustration and
  is a separate question the report itself separates out (light 0.50, dark 0.12 against
  0.62 / 0.18 at the bottom). This change touches the band only.

## Consequences

- The illustration runs through the band; the only edge left is the deliberate hairline
  (~14 luminance units over the light art, ~25 over the dark one).
- The measured seam step falls from 37 to 4 luminance units in light and from 20 to 4 in
  dark.
- The spec derives the scrim from `skin.json` rather than hard-coding it, so any future
  change to `contributes.backgroundMedia` re-opens the composition check.
- `skins/miku/preview/light.jpg` still shows the shipped band. A maintainer-side skin
  fix does not bump `skins/miku/skin.json` (the same as stellar-diva in b15c7e1), and the
  Workshop only offers strictly newer versions, so installed 0.5.1 copies receive this
  when the skin's version next advances and the preview is reshot in that round.
