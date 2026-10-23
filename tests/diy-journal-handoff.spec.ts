// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest'
import { createSkinController, type ControllerSkinEntry } from '../src/client/runtime/skin-controller.ts'
import { createEffectLedger } from '../src/client/runtime/effect-ledger.ts'
import { makeSkinIndexTap, makeSkinIndexRows } from '../src/tap-index-adapter.ts'
import { isInstallSpecValid } from '../src/client/plugin-install-faces.ts'

const id = 'diy-journal-plugin'
const entry: ControllerSkinEntry = { manifest: { id, delegated: {
  package: '@alphazerolan/dsh-plugin-diy-journal', selectionMode: 'explicit',
  repository: 'https://github.com/Alphazerolan/diy-journal-settings',
  bodyAttr: 'data-dsh-diy-journal', handoffAttr: 'data-dsh-diy-journal-handoff', installed: true,
} } }
const legacy: ControllerSkinEntry = { manifest: { id: 'claude-style', delegated: {
  ...entry.manifest.delegated!, selectionMode: undefined,
} } }
const root = () => document.documentElement
beforeEach(() => {
  root().removeAttribute('data-dsh-skin')
  root().removeAttribute('data-dsh-delegated-skin')
  document.head.innerHTML = ''; document.body.innerHTML = ''
})

it('selects exactly one delegated owner, yields legacy peers and restores cancelled previews', async () => {
  const persist = vi.fn(async () => {})
  const loadStylesheet = vi.fn(async () => {})
  const c = createSkinController({ doc: document, ledger: createEffectLedger(), persist, loadStylesheet })
  await c.switchTo(id, entry)
  expect(root().getAttribute('data-dsh-delegated-skin')).toBe(id)
  expect(root().getAttribute('data-dsh-skin')).toBe(id)
  expect(loadStylesheet).not.toHaveBeenCalled()
  await c.tryOn(null, null)
  expect(root().hasAttribute('data-dsh-delegated-skin')).toBe(false)
  expect(root().hasAttribute('data-dsh-skin')).toBe(false)
  await c.exitTryOn()
  expect(root().getAttribute('data-dsh-delegated-skin')).toBe(id)
  await c.tryOn('claude-style', legacy)
  expect(root().getAttribute('data-dsh-delegated-skin')).toBe('claude-style')
  expect(root().hasAttribute('data-dsh-skin')).toBe(false)
  await c.exitTryOn()
  expect(root().getAttribute('data-dsh-skin')).toBe(id)
  expect(persist).toHaveBeenCalledTimes(1)
  c.shutdown()
  expect(root().hasAttribute('data-dsh-delegated-skin')).toBe(false)
  expect(root().hasAttribute('data-dsh-skin')).toBe(false)
})

it('adopts after restart without persisting, and withholds both markers for wallpaper', async () => {
  let wallpaper = false
  const persist = vi.fn(async () => {})
  const c = createSkinController({ doc: document, ledger: createEffectLedger(), persist,
    suppressSkin: () => wallpaper, loadStylesheet: vi.fn(async () => {}) })
  await c.adopt(id, entry)
  expect(root().getAttribute('data-dsh-skin')).toBe(id)
  expect(persist).not.toHaveBeenCalled()
  wallpaper = true; await c.refresh()
  expect(root().hasAttribute('data-dsh-skin')).toBe(false)
  expect(root().hasAttribute('data-dsh-delegated-skin')).toBe(false)
  wallpaper = false; await c.refresh()
  expect(root().getAttribute('data-dsh-delegated-skin')).toBe(id)
  await c.switchTo(null, null)
  expect(root().hasAttribute('data-dsh-delegated-skin')).toBe(false)
  c.shutdown()
})

it('failed or stale asset loads cannot replace a newer delegated selection', async () => {
  let release!: () => void
  const c = createSkinController({ doc: document, ledger: createEffectLedger(), persist: async () => {},
    loadStylesheet: () => new Promise<void>(resolve => { release = resolve }) })
  const asset: ControllerSkinEntry = { manifest: { id: 'asset', contributes: { stylesheet: 'skin.css' } } }
  const pending = c.switchTo('asset', asset)
  await c.switchTo(id, entry)
  release(); await pending
  expect(root().getAttribute('data-dsh-delegated-skin')).toBe(id)
  expect(root().getAttribute('data-dsh-skin')).toBe(id)
  c.shutdown()
})

it('stamps first paint without asset CSS and respects wallpaper prediction', () => {
  const html = '<html><head></head><body></body></html>'
  const deps = { readActiveId: () => id }
  expect(makeSkinIndexRows(deps)()).toEqual([])
  const out = makeSkinIndexTap(deps)(html)
  expect(out).toContain('data-dsh-delegated-skin="diy-journal-plugin"')
  expect(out).toContain('data-dsh-skin="diy-journal-plugin"')
  expect(out).not.toContain('stylesheet')
  const withheld = makeSkinIndexTap({ ...deps, readWallpaperOnStage: () => true })(html)
  expect(withheld).not.toContain('data-dsh-delegated-skin=')
  expect(withheld).not.toContain('data-dsh-skin=')
  const old = makeSkinIndexTap({ readActiveId: () => 'claude-style' })(html)
  expect(old).not.toContain('data-dsh-skin=')
})

it('accepts a narrow GitHub source but refuses URLs, local paths and ref expressions', () => {
  expect(isInstallSpecValid('github:Alphazerolan/diy-journal-settings')).toBe(true)
  expect(isInstallSpecValid('github:Alphazerolan/diy-journal-settings#' + 'a'.repeat(40))).toBe(true)
  for (const spec of ['github:../local', 'github:user/repo#main;bad', 'github:user/repo#HEAD~1',
    'github:user/repo?token=x', 'https://github.com/user/repo', 'file:./repo', 'github:user/repo\n']) {
    expect(isInstallSpecValid(spec), spec).toBe(false)
  }
})
