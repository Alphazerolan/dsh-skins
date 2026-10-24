# Agent Note: The 2026-10-21 DIY Journal intake round

Status: implemented

## Problem

Pull request #81 (\`Alphazerolan\`, \`codex/diy-journal\`) submits \`skins/diy-journal\` 1.14.1: 485 files, +8454 lines, a paper-and-tape skin with 14 separately themed ChatGPT-generated illustrations, a reviewed \`hooks.mjs\`, and six in-app light/dark captures. The author's own submission states that reference-character rights and redistribution permission are unverified, leaves both licensing checklist items unchecked, and asks reviewers not to merge before that clearance is resolved. The owner asked for this one to be waved through and merged quickly, so the round had to decide what "waved through" can still mean when the submission itself withholds a gate item.

## Decision

**It ships, and the two gaps are recorded rather than papered over.** The disclosure the gate actually asks for is present and honest: \`NOTICE\`, \`ARTWORK.json\`, \`skin.json\`.attribution and both READMEs name ChatGPT generation (2026-10-21), credit the reference video's designers (@ZipZipPipe, @上善无形), state that the character is a community fan interpretation and not DeepSeek official artwork, keep third-party rights with their holders, and never present generation as authorization. The missing piece is one sentence the repository's fan-work convention adds, "personal non-commercial use only"; it is absent here, and filling it in on the contributor's behalf would mean asserting a restriction the contributor never wrote, so it was left to them with a note in the pull request instead of a maintainer edit.

**The gates that could be checked mechanically all passed.** The fork's \`CI\` run sat at \`action_required\` until it was approved (run 39608824390); the required context \`skin catalog, typecheck, test and build\` then passed in 1m1s on \`3ceb731\`. Locally, \`skin-center:check\` reports 62 catalog skins and \`skin-hooks:check\` matches the new \`diy-journal\` registry entry (the \`lib/index.js\` and \`src/reviewed-hooks.generated.ts\` diffs are that entry and nothing else), and all six evidence files verify against \`evidence/diy-journal-SHA256SUMS.txt\`.

**The reviewed hook is projection-only.** \`hooks.mjs\` (227 lines) reads the DOM and writes \`data-cg-active\` / \`data-cg-spin\` attributes, plus a \`window.__cg*\` diagnostic namespace; it opens no network connection, touches no file or Node API, and \`ctx.onCleanup\` disconnects its \`MutationObserver\` and the 2s safety interval. \`skin.css\` and \`patches.css\` contain no \`@import\`, no remote URL, and load only the two bundled OFL fonts. Its cost model is the one to watch later: scoring walks every descendant of a conversation row with \`getComputedStyle\`, throttled to a 200ms rAF merge and cached behind a row signature.

**Aesthetics: pass.** Both previews (2560x1392) and all six captures were read at full size. The notebook frame, punched edge, tape corners and grid-paper composer hold together across home, settings and conversation; the character is uncropped with no extra limbs or wrong-frame artifacts; both themes are complete and the settings dialog keeps readable panel contrast in dark. It is not a recoloured template skin.

**Size is the one number that stands out and is carried forward.** The directory is 100MB against the previous maximum of 21MB (\`shuimo-danqing\`): a 24.2MiB \`LXGWWenKai-Medium.ttf\` and fourteen 3-5MB SVGs with embedded rasters. Every ceiling is still met today (25MiB per file in the market asset path, 2000 files per asset against 485), so nothing blocks, but the font can be subset and the SVGs re-encoded to WebP in a follow-up.

## Alternatives considered

Holding the merge until the author reworded their licensing section was rejected: the owner asked for this submission to move now, and the disclosure that exists already covers provenance, non-affiliation and rights ownership, which is what the gate protects. Turning the missing sentence into a maintainer edit of \`NOTICE\` was rejected for the opposite reason: the review discipline says maintainers do not complete or vouch for a contributor's provenance, and the sentence would be a grant only the contributor can make.

Treating the author's "do not merge yet" as a veto was rejected: it is a reviewer courtesy, not a hold the repository defines, and the outstanding item is character clearance the repository has never required for fan-work skins already shipping (\`whale-maid\`, \`maid-atelier\`, \`whalechan-harness\` and five more whale-line skins are in the catalog with credited but unverified fan characters).

Blocking on the 100MB package was rejected: the file-count and per-file caps are the ones the installer and market build enforce, both pass, and rejecting on total size would need a rule that does not exist yet. Recording it as a follow-up is the useful outcome.

## Consequences

Pull request #81 merged as \`62b8944\`; the dsh-web \`satellites/dsh-skins\` pin moves to that commit in the same round and \`market/dist\` is rebuilt from it, so the Workshop gains a tenth whale-line skin and its largest asset so far. The contributor keeps one open item: the non-commercial sentence, plus optional asset slimming. The next intake round that touches \`diy-journal\` should re-check the \`hooks.mjs\` scoring cost on a long conversation, because it re-scores every descendant of every conversation row when the row signature changes.
