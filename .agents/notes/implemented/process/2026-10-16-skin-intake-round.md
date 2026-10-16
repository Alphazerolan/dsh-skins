# Agent Note: The 2026-10-16 skin intake round

Status: implemented

## Problem

Four pull requests were open. #70 (frutiger-aero 1.1.0) and #68 (model-dorm
floating-surface tokens) change existing skins; #66 (endfield-baker) adds one and
#64 (windows-xp) adds another. This repository publishes to every Workshop user,
so each decision has to rest on the shipped artifacts - the evidence files, the
provenance record, the rendered result - rather than on the pull request text.

## Decision

**#70 merged as `9298016b`.** All three gates hold: the two images embedded in the
description are byte-identical to the committed `evidence/frutiger-aero-*.png`
(sha256 `39bdf7aa…`, `29f8e33b…`, recomputed independently), the submission-policy
lane's Evidence step genuinely ran, and `skin.json` plus both READMEs and LICENSE
credit every asset as programmatic original work with no depicted character. The
1.1.0 change removes four `backdrop-filter` uses; the quantised banding it claims
to fix measures 95.6% to 2.5% of the image.

**#66 merged as `8b594035`.** The first review returned it: the NOTICE said the
right to redistribute was not established while 15 of 16 assets came from a
third-party fan site. The contributor answered with a policy position rather than
replacement assets - the GRYPHLINE Endfield fan-content guidelines as the basis,
an explicit claim that publication falls inside the permitted non-profit
fan-creation scope, and an express assumption of copyright and compliance
responsibility. That satisfies the gate's requirement for a licensing basis and
for the contributor to carry the risk, so the merge proceeded. The README keeps
its remaining caveats ("the policy's application … remains uncertain", "not
file-by-file official authorization") and those are load-bearing: the acceptance
rests on them staying in the file.

**#68 and #64 did not merge.** #68 submitted evidence byte-identical to the
pre-change images and to the skin's own store preview, so it proves the skin is
unbroken rather than that the new tokens take effect; batch 4's radius tokens and
its focus-ring colour change are visible at preview scale and are outside the
"shadows differ by a few levels" exemption, so a floating-surface close-up pair
was requested. #64 shows a wallpapered UI with visible construction artefacts -
a hard-edged bright rectangle at the top of both wallpapers, cloud outlines drawn
as hollow contours, a low-opacity disc with smeared white lines standing in for
the sun, uniform star noise in the dark variant - and its manifest description and
README title still call the wallpapers "Bliss", which is Microsoft's XP wallpaper
name and contradicts the same section's claim of no third-party material. Both
stay open on a request-changes review.

## Alternatives considered

**Accept #66 on the original NOTICE wording.** The NOTICE said outright that the
right to redistribute was not established, which the gate refuses on its face;
the contributor has since replaced that sentence with a policy claim, so the two
states are not the same submission and the earlier answer does not carry over.

**Merge #68 on the strength of its green checks.** The evidence lane only compares
the description's images against the committed files; it cannot see that the pair
is the unmodified store preview. Passing that lane is not the same as meeting it.

**Treat #64's Bliss naming as cosmetic.** It is the sentence that tells readers
the artwork is original. Leaving a Microsoft-owned photograph's name on an
original render is the exact contradiction the intake rules require removing.

## Consequences

Two skins reached `main`, one update and one addition. The evidence lane cannot
tell a change's screenshot from the previous release's, so byte-identity checks
have to be paired with a read of the image itself; that read is now the reason #68
is open rather than merged. #66's acceptance sets the precedent that a cited
fan-content policy plus an explicit responsibility statement satisfies the
provenance gate, which is weaker than per-file authorization and should be
revisited if a rights holder objects.


## Second pass, 2026-10-16 (maintenance round, read-only)

No skin action was taken this round. Both open skin pull requests were read-only
checks and neither produced a decision to execute.

**#68 (model-dorm floating-surface tokens)** still awaits its author. The
maintainer review requesting changes is timestamped after its last commit, so
there is nothing new to review.

**#64 (windows-xp)** was withdrawn by its own author at `2026-10-16T13:17:53Z`
with `mergedAt` null. The open review request the maintainer had left on it is
therefore moot; it is recorded here so a later round does not read the closed
state as a merge.

## Decision

Leave both alone. Re-reviewing a pull request whose author has not pushed since
the review is how a thread fills with duplicate requests, and the withdrawal is
the author's signal to give, not the maintainer's to interpret.

## Alternatives considered

**Close #68 as stale.** It was reviewed hours earlier, which is not staleness; the
stale-assignment policy measures maintainer response, and the maintainer has
responded.

**Re-comment on #68 with the same findings in shorter form.** It carries no new
information and would only re-notify the author.

## Consequences

The skin catalog is unchanged and no pin moved for this repository this round.
Reading a withdrawn pull request as merged would be the real failure mode here, so
the withdrawal is recorded explicitly rather than inferred from the closed state.
