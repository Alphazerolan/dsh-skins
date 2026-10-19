// @vitest-environment jsdom
/**
 * #1907: a standalone install of the skin center must not cancel the macOS
 * window-drag region.
 *
 * The official base stylesheet resolves every DIRECT body child into a
 * "-webkit-app-region: no-drag" box, and Electron composes the window's
 * draggable region as union(drag) minus union(no-drag). The decoration layers,
 * the composer frost follower and the skin backdrop veil are all full-viewport
 * body children mounted by this runtime for the STOCK look too, so without a
 * guard of their own they subtract the whole window from that region and the
 * title area stops dragging.
 *
 * The aggregate package (dsh-web-all) already carries that guard for the
 * bundles it inlines. A standalone install of this package never loads that
 * layer, so the guard has to ship in this package's own injected stylesheet -
 * and it has to be UNscoped by the active-visual heads, because the layers it
 * covers exist before any skin is chosen.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  installShellRenderingAdapter,
  shellRenderingCss,
  SHELL_RENDERING_STYLE_ATTR,
} from '../src/client/runtime/shell-rendering.ts'

/** Body children this runtime mounts, every one of them non-interactive. */
const MOUNTED_BODY_CHILDREN = [
  '[data-dsh-skin-layer]',
  '[data-dsh-composer-frost]',
  '[aria-hidden="true"]',
] as const

const GUARD_SELECTOR = /^html\[data-platform="darwin"\]\s+body\s*>\s*:is\(/
const GUARD_DECLARATION = '-webkit-app-region: initial !important'
const APP_REGION_DECLARATION = /-webkit-app-region\s*:/g

/** Drop block comments so prose about the property is never read as a rule. */
function withoutComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** Every flat rule of the sheet, as selector text plus declaration text. */
function rules(css: string): Array<{ selector: string; body: string }> {
  const found: Array<{ selector: string; body: string }> = []
  for (const rule of withoutComments(css).match(/[^{}]+\{[^{}]*\}/g) ?? []) {
    const brace = rule.indexOf('{')
    found.push({
      selector: rule.slice(0, brace).trim().replace(/\s+/g, ' '),
      body: rule.slice(brace + 1, rule.lastIndexOf('}')),
    })
  }
  return found
}

/** The single darwin body-child guard rule, or null when the sheet lacks it. */
function darwinGuardRule(css: string): { selector: string; body: string } | null {
  const match = /(html\[data-platform="darwin"\]\s+body\s*>\s*:is\([^{]*)\{([^}]*)\}/.exec(withoutComments(css))
  if (match === null) return null
  return { selector: match[1].trim().replace(/\s+/g, ' '), body: match[2] }
}

let activeDispose: (() => void) | null = null

beforeEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
})

afterEach(() => {
  activeDispose?.()
  activeDispose = null
  document.head.innerHTML = ''
  document.body.innerHTML = ''
})

describe('macOS window-drag guard for skin-center body shells (#1907)', () => {
  it('leaves every mounted body child out of the app-region computation on darwin', () => {
    // Given the shared shell-rendering stylesheet this package injects at boot
    const css = shellRenderingCss()

    // When the darwin body-child guard is read out of it
    const guard = darwinGuardRule(css)

    // Then the guard exists, anchors darwin, and exempts each mounted shell
    expect(guard, 'the stylesheet carries no darwin body-child app-region guard').not.toBeNull()
    expect(guard!.selector).toMatch(GUARD_SELECTOR)
    for (const child of MOUNTED_BODY_CHILDREN) {
      expect(guard!.selector, 'guard does not cover the ' + child + ' shell').toContain(child)
    }
    expect(guard!.body).toContain(GUARD_DECLARATION)
  })

  it('declares the exemption as initial !important so the official sheet cannot outrank it', () => {
    // Given the official base stylesheet also targets direct body children
    // When this guard competes with it
    const guard = darwinGuardRule(shellRenderingCss())

    // Then the exemption is a declaration of its own, marked important: the
    // official selector outranks this one, and a non-important declaration
    // would lose while still leaving the element inside the no-drag region
    expect(guard!.body).toContain('!important')
    expect(guard!.body).not.toContain('no-drag')
  })

  it('changes nothing for a platform other than darwin', () => {
    // Given the sheet
    const css = withoutComments(shellRenderingCss())

    // When every rule that touches the property is collected
    const guarded = rules(css).filter(rule => rule.body.match(APP_REGION_DECLARATION) !== null)

    // Then the darwin guard is the only one, so no other platform and no skin
    // paint is affected, and its one head is the darwin anchor
    expect(guarded).toHaveLength(1)
    expect(guarded[0]!.selector).toMatch(GUARD_SELECTOR)
    expect(guarded[0]!.selector.split('html[data-platform="darwin"]')).toHaveLength(2)
  })

  it('is not scoped under the active-visual heads, which a stock install never stamps', () => {
    // Given a page with no catalog skin and no custom theme
    const guard = darwinGuardRule(shellRenderingCss())

    // When the guard selector is inspected
    // Then it anchors the platform alone: the decoration layers exist for the
    // stock look, so an active-visual prefix would keep the defect alive in the
    // exact case the issue reports
    expect(guard!.selector).not.toContain('html[data-dsh-skin]')
    expect(guard!.selector).not.toContain('html[data-dsh-custom-theme]')
  })

  it('is delivered with the stylesheet the runtime actually mounts', () => {
    // Given a document the adapter installs into
    // When the shared corrections are installed at boot
    activeDispose = installShellRenderingAdapter(document)
    const mounted = document.head.querySelector<HTMLStyleElement>(`style[${SHELL_RENDERING_STYLE_ATTR}]`)

    // Then the guard ships inside that one injected stylesheet, not as a
    // parallel injection of its own
    expect(mounted).not.toBeNull()
    expect(mounted!.textContent).toBe(shellRenderingCss())
    expect(darwinGuardRule(mounted!.textContent!)).not.toBeNull()
    expect(document.head.querySelectorAll('style')).toHaveLength(1)
  })
})
