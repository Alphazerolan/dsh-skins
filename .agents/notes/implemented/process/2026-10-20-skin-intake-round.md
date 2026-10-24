# Agent Note: The 2026-10-20 skin intake round

Status: implemented

## Problem

The whale-watercolour submission (#77) came back after two automatic closes with its provenance and naming questions answered, and it carries the decision the 2026-10-17 round left open: it is the catalog's first light-only skin, so the market shows the same preview in both modes and a dark-mode user receives a light interface. The model-dorm token fix (#68) still waits on the close-up the previous round asked for, and its evidence files have not moved since 2026-10-13.

## Decision

**The light-only exception is accepted.** whale-watercolour ships as the first skin in the catalog whose dark mode renders the light interface, and the parity artifact makes that a checkable property instead of a claim: switching to dark produces zero pixel change. The precedent already runs the other way too, since shuimo-danqing is dark-only and shipped with byte-identical previews, so both are now treated the same: one theme is acceptable when the skin states it in the manifest and both READMEs and proves it with parity evidence. The decision is recorded here rather than left implied, because the 2026-10-17 round recorded it as raised and not decided.

**#77 passes all three intake gates with one text fix outstanding.** Evidence: the two preview images and the two evidence images are byte-identical at sha256 `32758b56...`, the parity image is `9b638ffd...`, and the verify-evidence lane is green. Provenance: `skin.json`, the directory LICENSE and both READMEs name the generative source and the author's own character line, matching the author's four existing skins. Aesthetics: the 2560x1437 background renders 1:1 with no crop distortion, watermark or AI limb errors, panel and title text measures 6.7-14.8:1, and the composer placeholder sits at 4.2-4.8:1 against the 4.5 line. What remains is one inaccuracy: `skin.json:10` and both READMEs claim exactly two solid surfaces, while only the send control is solid (`patches.css:1260-1268`) and the new-session control is a tinted outline (`patches.css:915-927`).

**#68 stays on changes requested and is not closed.** The head has not moved since 2026-10-13 and the two evidence images added in the change are still byte-identical to the pre-change files and to the skin's own previews, so the floating-surface change carries no pixel evidence. The token work itself verifies: 141 tokens declared per side, light and dark matching one for one, and the contract's 26 floating-surface tokens reduced to the two the description says are deliberately kept.

## Alternatives considered

Requiring a real dark state before accepting #77 was rejected: it would hold a light-only skin to a stricter rule than the catalog already applies to dark-only skins, and the parity artifact makes the single-theme choice verifiable rather than assumed.

Rejecting the duplicated preview image outright was rejected for the same reason: the rule that produced the earlier request was about skins that own two themes and copy one preview into both slots, which is not this case.

Closing #68 as stale was rejected: it is seven days old, inside the window the review discipline allows before a stale close.

## Consequences

Neither pull request merges in this round, so the skins pin in dsh-web does not move. #77 is one edited sentence away from a merge; #68 is one screenshot away from a merge.
