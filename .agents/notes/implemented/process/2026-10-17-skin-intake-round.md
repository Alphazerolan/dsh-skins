# Agent Note: The 2026-10-17 skin intake round

Status: implemented

## Problem

Two submissions were open: a new skin (#74, whale-senren) and a token fix for an existing one (#68, model-dorm). The intake gate asks for user-visible evidence, provenance, and an aesthetic judgement on the actual assets, and both submissions still had an open provenance or evidence question that a green CI lane cannot answer.

## Decision

**#74 is held on its own provenance record.** The evidence gate passes: three images sit under `evidence/`, the submission policy lane is green, and the aesthetic review passed on the real files, with no crop distortion, watermark or banding at 1:1 on the 2560x1437 background, readable panel and composer text, and a structure matching the existing skins. What blocks it is a contradiction inside the record: `skin.json` names the skin after the Chinese title of the Yuzusoft work Senren Banka and tags it `senren-banka`, while the description states the artwork contains no existing work's character, mark or trademark. The review asks for a rename or an explicit unrelated-work statement, and for one line on whether a generative tool produced the illustration, since the EXIF/XMP is stripped and the submission template asks for that class.

**#68 stays on changes requested.** The earlier review asked for a close-up of a floating surface, and the head has not moved since 2026-10-13; the two evidence images added in the change are byte-identical to the pre-change images and to the skin's own previews, so the pixel-difference argument stays unproven. The token-name and scope answers were verified instead of taken on trust: the three wrong token names occur zero times in the head, and the installed `dsh-client-ui-theme` 0.2.1-rc.2 declares `--dsw-*` on `body,body *` in exactly one of its two matching rules, the elevation family.

**The light-only question was raised, not decided.** This is the first skin in the catalog tagged light-only: the market shows the same preview for both modes and a dark-mode user receives a light interface. The author was asked to state the intent in the skin README, and the product decision stays with the maintainer.

## Alternatives considered

Accepting #74 with a follow-up README edit was rejected: the provenance declaration is the record the licence and takedown process lean on, and it currently contradicts the manifest it ships with.

## Consequences

Neither skin merges in this round, so the skins pin in dsh-web does not move.
