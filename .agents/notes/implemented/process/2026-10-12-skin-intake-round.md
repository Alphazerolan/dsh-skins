# Agent Note: The 2026-10-12 skin intake round

Status: implemented

## Problem

Five pull requests were open: #64 (windows-xp, a new dual-theme skin), #63
(blueprint, dropping the HUD title bar so the Windows caption is clear), #61
(verdandi host adaptation), #60 (frutiger-aero, a new skin from a first-time
contributor) and #57 (seaming the shuimo-danqing background loop). This
repository publishes its assets to every Workshop user, so each decision has to
rest on the shipped artifacts - the evidence files, the provenance records inside
the skin directory, and the rendered result itself - rather than on the pull
request text.

## Decision

**Three pull requests were merged: #61 as `bac5bf24`, #57 as `3f4d5a6a` and #60 as
`ace4f2b2`; #63 and #64 are held with written blockers.** The dsh-web gitlink
moved to `ace4f2b2` and `market/dist` was rebuilt in the same maintenance run.

- **#61 (verdandi)** merged. The hooks change, the regenerated
  `src/reviewed-hooks.generated.ts` and the committed `lib/index.js` agree: the
  recorded `hooks.mjs` sha256 `221a8647…` and `skin.json` sha256 `538eba40…` both
  match, and a fresh build leaves `git status` empty. The ten evidence images
  match their committed files byte for byte, and the before/after pairs show what
  the description claims: six sidebar rows become uniform host geometry, the trace
  tab hugs the lane on its left edge with a 6px right radius, and the running line
  takeover stays readable. Three non-blocking cleanups were noted in the review
  (six new inline-data-URI warnings in `skin.css`, plus the now-unused
  `SVG_PROPERTIES` table, `asset()` and the unused values in `ASSET_PROPERTIES`).
- **#57 (shuimo-danqing loop seam)** merged. This is a bug fix, and the
  measurement is the argument: the shipped file ended on ink (mean luminance 67.6)
  and started on paper (237.8), so every 25.333 s the loop cut with a seam of
  171.06 against a p95 frame-to-frame step of 8.70. The encoder had to change
  anyway because HEVC does not play in the Electron shell, so the loop is seamed
  in the same pass: the last 1.2 s cross-dissolves into a clone of frame 0, seam
  0.01, at a lower bitrate (23.08 MiB to 20.54 MiB) with frame count, frame rate,
  duration and resolution unchanged. The two evidence files show the dissolve and
  the per-frame luminance trace; `skin.json` and both READMEs were updated from
  "pure transcode" to "self-overlap bake" with the 0.01 figure and SSIM 0.9930.
- **#60 (frutiger-aero)** merged. The evidence, provenance and aesthetic gates all
  pass. `LICENSE` is MIT, the attribution states that the wallpaper is generated
  by code and the bubbles are pure CSS radial gradients with no third-party images
  and no characters, and that the radial alpha profile references
  `khang-nd/bubbles` (MIT) by numbers only with no assets copied. Both themes
  render completely and stay legible. Two non-blocking notes: the light theme's
  clear-glass left rail puts the workspace list over cloud imagery at low
  contrast, and `aero-sky.webp` shows 2-3 faint concentric bands in the sun glow.
  The pull request had sat in `action_required` because a first-time contributor's
  fork run waits for approval; the round approved it, and the required check then
  ran green.
- **#63 (blueprint HUD removal)** is held on previews. The code change itself is
  correct - the titlebar construction and its cleanup are gone, `patches.css`
  follows, `skin-hooks-registry: check OK`, and the recorded `hooks.mjs` sha256
  `086184c7…` matches `src/reviewed-hooks.generated.ts` and `lib/index.js` with no
  build drift. But `preview/light.jpg` and `preview/dark.jpg` are still the old
  images and still show the "DSH BLUEPRINT / DRAWING 01" bar this change deletes,
  so the catalog preview contradicts the shipped skin. The contributor had already
  flagged the missing README and the absent `skin.json` licence fields; both
  predate this change and are not counted against it.
- **#64 (windows-xp)** is held: the artwork contradicts its own provenance
  record. `assets/xp-light-bg.webp` and `xp-dark-bg.webp` each contain a
  full-length anime character occupying the right half of the frame, while
  `README.md:142`, `README.zh.md:122` and `skin.json`'s `attribution` all state
  the two wallpapers are the author's own photographs, and `skin.json`'s
  `description` calls them "a pair of Bliss the user gave". No work or rights
  holder is named for the character anywhere, so the template requirement that
  every depicted character be named with its work and rights holder is unmet. The
  engineering side is clean (catalog check OK, four evidence files byte-identical
  to the committed ones, no out-of-scope files); the hold is purely on the
  material. Two smaller errors were also reported: the READMEs say "17 hand-written
  SVGs" where 19 exist, and the session-state screenshots show the conversation
  column translucent enough for the wallpaper to read through, against the README's
  "every panel is an opaque XP window" and `glassBase: 0`.

## Alternatives considered

- **Letting the Windows CI check stand in for the content gates on #64.** The
  evidence check only proves the images in the description equal the images in the
  commit; it says nothing about what those images depict, and the repository's
  contract makes the contributor responsible for the rights record. Merging on a
  green check would have published unlicensed third-party character artwork.
- **Merging #63 and filing the stale previews as a follow-up.** The catalog
  preview is the store's only pre-install view of the skin; shipping a preview of
  a bar the skin no longer draws misrepresents the product to every Workshop user,
  and regenerating two images is cheaper than the correction afterwards.
- **Holding #57 again for a seamless loop.** The earlier round already accepted
  the hard cut as deliberate and documented. This round did the opposite of moving
  the goalposts: it merged the change that removes the seam entirely, since the
  re-encode was unavoidable for the codec reason.
- **Rejecting #60 for the low-contrast light rail.** Both themes render fully and
  the text stays readable; the contrast note is a refinement, not a gate failure.

## Consequences

- Main now carries 60 catalog skins (59 before the round).
- The Workshop sees #61, #57 and #60 only after the dsh-web submodule gitlink
  moves to this repository's main and `market/dist` is rebuilt; this round pinned
  it in the same maintenance run, which also picked up miku 0.5.1 - merged on
  2026-10-10 but never pinned.
- #63 and #64 stay open with their blockers written on the pull requests.
- The round's shared observation, recorded for the next one: the automated
  evidence check verifies image identity, not image content, so the provenance and
  aesthetic gates cannot be delegated to CI.
