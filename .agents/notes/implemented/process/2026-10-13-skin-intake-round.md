# Agent Note: The 2026-10-13 skin intake round

Status: implemented

## Problem

Four pull requests were open: #63 (blueprint, deleting the HUD title bar so the
Windows caption stays clear), #64 (windows-xp, held in the previous round on
material gates), #66 (endfield-baker v0.9.1) and #68 (model-dorm, covering the
floating-surface tokens). This repository publishes its asset packs to every
Workshop user, so each decision has to rest on the shipped artifacts - the
evidence files, the provenance record inside the skin directory, and the rendered
result - rather than on the pull request text. #63 and #64 carry decisions from
the 2026-10-12 round; this round closes the first and re-opens the second on new
material.

## Decision

**#63 (blueprint HUD removal) merged as `365763c9`, the current main tip.** The
change deletes the titlebar construction and its teardown from
`skins/blueprint/hooks.mjs` and the `.dsh-bp-titlebar*` rules that followed from
`patches.css`: 9 files, +48/-124 against the merge's first parent. No live
reference to `dsh-bp-titlebar` or `dsh-bp-bar-top` survives anywhere in the
repository; the single remaining textual occurrence is a quoted CSS snippet
inside the 2026-09-26 frame-height note, and `patches.css` keeps only the host's
own `--dsh-windows-titlebar-height` custom property. The recorded blueprint
`hooks.mjs` digest is `086184c78ea212c3674bae76eee077cbe83862e4c6cdcd0e2ee65804f6784b54`
in both `lib/index.js` and `src/reviewed-hooks.generated.ts`, and it equals
`shasum -a 256 skins/blueprint/hooks.mjs`, so the committed build still travels
with its source. The round ran `skin-center:check` over 59 skin sets,
`skin-hooks-registry: check`, `tsc` and `tsdown`, found no `lib/` drift, and both
CI jobs passed. `580e666` closed the previous round's hold: `preview/light.jpg`
and `preview/dark.jpg` are now byte-identical to `evidence/blueprint-light.jpg`
and `evidence/blueprint-dark.jpg` (sha256 `ef795878…` and `0dc2d689…`), so the
store preview no longer shows the bar the skin stopped drawing (the round
reported a hard horizontal edge at 30 px in the replaced images). The maintainer
read the rendered result and passed the aesthetic gate.

**#64 (windows-xp) is held on a new evidence problem, with every item from the
previous round resolved.** The wallpapers are now procedurally rendered day and
night art with no character in them, the README's SVG count matches the 19 files
under `assets/*.svg`, and the session-state client area samples opaque. The new
blocker is the middle column of `evidence/windows-xp-session-{light,dark}.jpg`:
the conversation body is fully readable and is a contributor-agent exchange about
the review of another skin (blueprint), and these files ship with the repository
and the pull request. The contributor has to clear the session and reshoot or
redact it, and replace the same files the pull request description links.

**#66 (endfield-baker v0.9.1) is held on the copyright gate.** The manifest, both
READMEs and the pull request body state that the material was taken from page
screenshots or developer-tool extraction at `chat.peilika.beer` and reworked, that
redistribution authorization is unconfirmed, and that the author cannot establish
whether the assets were redrawn or adapted from game material. `CONTRIBUTING`
does not list works whose source is not established. The same hold asks for a
per-asset source list in a `NOTICE` inside the skin directory, for every depicted
character to be named with its work and rights holder, and for
`preview/light.jpg` and `preview/dark.jpg` to stop being byte-identical (the store
would show one image for both themes).

**#68 (model-dorm floating-surface tokens) is held.** The approach holds: a `*`
selector with `!important` outranks the official `body, body *` declarations once
`transformSkinCss` has run, and the contract reproduction went from 104 to 115
covered declarations. But three of the 38 added declarations name tokens the
running shell does not define (`--dsw-menu-surface-fill`,
`--dsw-alias-turn-trigger-bg-hover`, `--dsw-alias-state-warn-primary`), so those
declarations do nothing. Two descriptions also contradict the measurement:
`README.zh` says "21 missing" where the coverage delta is 11, and a CSS comment
claims the alpha values are preserved verbatim. The two evidence images are
byte-identical to the images already on main, so they are not evidence for this
change.

## Alternatives considered

- **Releasing #64 from the previous round's pass instead of raising a new
  requirement.** The previous round's list covered the artwork and the provenance
  record, and all of it is fixed; but the replacement screenshots are new
  material, and the gate applies to what is submitted, not to how many rounds a
  contributor has already served. The readable text in them is a conversation
  about a third party's review that would be published to every clone, and letting
  it through because an earlier round had already commented once would be exactly
  the goalpost-moving the previous round was careful to avoid in the other
  direction.
- **Merging #63 with stale previews filed as a follow-up.** The previous round
  rejected that, and this merge is only possible because `580e666` reissued them
  in the same pull request; the store preview is the first and often the only view
  a user has of a skin.
- **Listing #66 because the contributor disclosed the doubt.** The disclosure is
  honest, but unconfirmed authorization is not established provenance; the rule
  exists because a listing tells every user the material may be redistributed.
- **Treating #68's three unmatched token names and its two description errors as
  cosmetic.** The purpose of the change is to cover tokens the shell exposes, so
  naming three the shell does not define makes the claimed coverage and the
  delivered coverage differ; the same applies to a comment asserting a property
  the diff does not have.
- **Counting #68's unchanged evidence images against it as a separate blocker.**
  They are the old images, so they neither support nor contradict the change; they
  were reported as non-evidence rather than as a reason to hold the fix itself.

## Consequences

- Main carries the same 60 skin directories as before this round (`skins/` holds
  60, verified); #63 changes an existing skin and adds none.
- The Workshop sees #63 through the dsh-web pin: `f6e4b1a4` on that repository's
  `dev` moves the `satellites/dsh-skins` gitlink from `ace4f2b2` to `365763c9` and
  rebuilds `market/dist` in the same commit, and that commit's `deploy-market` run
  is green.
- #64, #66 and #68 stay open with their blockers written on the pull requests.
- The finding this round adds to the previous one: the automated evidence check
  proves that the images in the pull request equal the images in the commit, not
  what they depict and not what text they carry, so a session screenshot published
  as skin evidence has to be read before it is accepted - the same class of gap as
  the provenance and aesthetic gates.
- Provenance of this note's numbers: the merge diff, the digest match, the absence
  of live titlebar references, the preview/evidence equality and the directory
  count were re-read in this worktree. The gate runs that need `node_modules`
  (`skin-center:check` and its 59-set figure, `tsc`, `tsdown`, the 104-to-115
  contract reproduction), the CI results and the aesthetic judgement are the
  round's measurements; this worktree carries no dependencies, so
  `skin-center:check` could not be reproduced here.
