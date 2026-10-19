# Agent Note: the standalone skin center keeps its body shells out of the macOS drag region

Status: implemented

## Problem

A standalone install of `@linxin666/dsh-client-ui-skin-center` could not drag
the macOS desktop window by its title area, and the system double-click action
(zoom to fit the screen) did nothing there. The aggregate package
`@linxin666/dsh-web-all` was unaffected.

The official base stylesheet resolves every **direct body child** into a
`-webkit-app-region: no-drag` box, sparing only the app's own root element.
Electron composes the window's draggable region as
`union(drag) - union(no-drag)`, so one body-level element that spans the
viewport subtracts the whole window from it — the official `[data-window-drag]`
chrome rows included. `pointer-events: none` does not exempt an element from
that computation; only a declaration of its own does.

This runtime mounts three such shells on `document.body`, and the first exists
for the stock look, before any skin is chosen:

| Shell | Source | Marker |
| --- | --- | --- |
| Six fixed decoration layers | `src/client/runtime/decoration-layers.ts` | `data-dsh-skin-layer`, `aria-hidden` |
| Composer frost follower | `src/client/runtime/backdrop-scene.ts` | `data-dsh-composer-frost`, `aria-hidden` |
| Skin backdrop blur veil | `src/client/background.ts` | `aria-hidden` only |

`dsh-web-all` already answers this for the bundles it loads, in its compat
patch layer (`src/client/index.ts`). A standalone install of the skin center
never loads that layer, and `grep -rn 'app-region' src/` here returned nothing:
the guard had no second home.

## Decision

The guard ships inside the one stylesheet this plugin already injects,
`shellRenderingCss()` in `src/client/runtime/shell-rendering.ts` — the sheet
`installShellRenderingAdapter` mounts at boot. No second injection path was
added.

```css
html[data-platform="darwin"] body > :is(
  [data-dsh-skin-layer],
  [data-dsh-composer-frost],
  [aria-hidden="true"]
) {
  -webkit-app-region: initial !important;
}
```

**The rule is deliberately outside the active-visual heads.** Every other rule
in that sheet is emitted through `scoped(...)`, i.e. under
`html[data-dsh-skin]` / `html[data-dsh-custom-theme]`, because those
corrections are skin paint. This one is not: the decoration layers are mounted
for the stock look too, which is the configuration the defect was reported in.
Prefixing it would have produced a guard that is inert exactly where it is
needed.

**`initial` is the initial value (`none`)** — the element and its whole
subtree leave the app-region computation rather than joining the drag region.
`!important` is required: the official selector is more specific.

**`[aria-hidden="true"]` stays in the list.** The backdrop veil carries no data
hook of its own, so the aria state is the only anchor it has. Narrowing the list
to the two `data-dsh-*` markers would silently uncover that one. Every element
the list matches is a shell this runtime mounts and declares non-interactive —
`src/` has exactly three body append sites and each is one of these shells — so
the head cannot reach a host- or plugin-owned node the way a bare
`body > div` would (see
[the classless body-child note](2026-10-05-classless-body-child-host-shells.md)).

## Alternatives considered

- **Import the aggregate's compat sheet, or re-export its constant.**
  Rejected: it lives in another repository and another package. A standalone
  install of the skin center does not have `dsh-web-all` at all, which is the
  entire premise of the issue.
- **Ask `dsh-web-all` to export the guard and depend on it.**
  Rejected: it inverts the dependency (the aggregate depends on the skin
  center, not the other way round) and would make the fix arrive only for users
  who also install the aggregate.
- **Emit the guard into the same sheet but through `scoped(...)`.**
  Rejected: with no skin active the selector matches nothing on darwin, so the
  stock install — the reported case — keeps the defect.
- **Declare `-webkit-app-region: initial` on the layer's inline style instead
  of a stylesheet rule.** Rejected: the official base rule outranks an inline
  declaration unless it is `!important`, and the veil in `background.ts` would
  need the same write, spreading one contract across three mount sites.
- **`no-drag` instead of `initial`.** Rejected: `no-drag` keeps the element
  inside the no-drag union, which is the region being subtracted. `initial`
  removes it from the computation, which is what the decoration needs.
- **List only the two `data-dsh-*` markers.** Rejected: see above — the veil has
  no marker to list.

## Consequences

- A standalone install on macOS drags by its title area again, including through
  the stock look with no skin selected; `html[data-platform="darwin"]` is only
  stamped by the desktop shell, so every other platform evaluates the selector
  to nothing.
- `tests/darwin-window-drag.spec.ts` pins the contract: the guard exists and
  anchors darwin, it covers all three mounted shells, it declares `initial
  !important`, it is the only `-webkit-app-region` declaration in the sheet (so
  no other platform or skin surface is touched), it is not scoped under the
  active-visual heads, and it ships inside the style element the adapter
  actually mounts. All five cases fail when the selector's platform token is
  altered, which was verified before landing.
- `lib/` is committed in this repository (`pnpm build` + `git diff --exit-code
  -- lib` is the CI gate), so the built bundle travels with this source change.
- The two packages now carry the same rule twice — here for a standalone
  install, in `dsh-web-all`'s compat layer for the aggregate. They are
  deliberately identical in shape; when one side changes, the other is the place
  to look.
