# Agent Note: dsh-model-capabilities leaves the semantic attr contract

Status: implemented

## Problem

The family repository removed the `dsh-model-capabilities` plugin
entirely: the official 0.2.1 Models UI covers what its provider-card
extension panel did. The skin repository's contract kept enumerating it —
`contracts/semantic-attrs-v1.md` carried eight `data-dsh-part` rows and one
`data-dsh-plugin` row for it, and `skins/claude/patches.css` listed
`[data-dsh-plugin="model-capabilities"]` in its shared plugin-card rule and
in the selector-policy comment. All of it dead surface: no DOM stamps those
attributes anywhere the skins run.

## Decision

**The contract and the claude skin stop naming dsh-model-capabilities.**

- `contracts/semantic-attrs-v1.md` — the eight part rows and the plugin row
  are deleted; the group counts move to what the tables actually carry
  (part 组 78 行, plugin 组 14 个; the previous part count of 81 had already
  drifted from the real 86 rows, so the heading is recount-checked rather
  than just decremented).
- `skins/claude/patches.css` — the selector leaves the shared plugin-card
  rule (and its comment enum), with the list comma repaired.

## Alternatives considered

- **Keeping the rows "for profiles that still run the old plugin".**
  Rejected: the plugin is removed from the family, not deprecated in place;
  a contract that enumerates unstamped attributes invites skins to style
  ghosts. Skins installed on an old host simply lose the (already unloaded)
  plugin's card styling.
- **Marking the rows deprecated instead of deleting.** Rejected: the
  enum's value is precisely "what is stamped at runtime"; a deprecated row
  reads as still-stamped to a skin author.

## Consequences

`pnpm skin-center:check`, `pnpm skin-hooks:check`, `pnpm test` (710) and
`pnpm typecheck` pass; the built `lib/` is untouched (skin assets are not
bundled). Any future plugin removal repeats this: delete the part/plugin
rows, recount the group headings, sweep the skins' selector comments and
shared rules.
