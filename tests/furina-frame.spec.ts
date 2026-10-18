// @vitest-environment jsdom

/**
 * furina Windows whole-window frame transparency (issue #78).
 *
 * The skin defines --dsw-specific-sidebar-fill as an almost opaque #f2f5fae6
 * (light) / #1d2539e6 (dark), alpha .902, and does not track the scrim. The web
 * host consumes that token on the sidebar only, so the illustration renders fine
 * there, but the Windows desktop shell paints it on its whole-window frame
 * element. That frame is a stacking context ancestor of the conversation column,
 * so it paints after the host's z-index: -2 backgroundMedia illustration and
 * covers it: the artwork reads as a washed-out plate with roughly a tenth of it
 * left, and neither the Background-occlusion nor the Background-blur slider can
 * reach the frame.
 *
 * The fix is the single declaration blue-fantasy (#1803), maid-atelier and
 * cyber-night (#1763) already ship. Because it is one line an unrelated edit
 * could silently drop, this spec pins the declaration, the surface it lives on,
 * the token it must not neutralize, the selector the skin-center /patches
 * transform produces for it, and the cascade result under a Windows-shell
 * fixture.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { transformSkinCss } from '../src/core/css-safety/transform.ts'

// Path-based like the other jsdom specs: under the jsdom environment the URL
// base of import.meta.url is not a file: URL, so resolving from __dirname is
// the stable form.
const SKIN_ID = 'furina'
const SCOPE = `html[data-dsh-skin="${SKIN_ID}"]`
const FRAME_RULE = '[class*="_frame"]'
const DIR = resolve(__dirname, '../skins/furina')
const PATCHES = readFileSync(resolve(DIR, 'patches.css'), 'utf8')
const SKIN = readFileSync(resolve(DIR, 'skin.css'), 'utf8')
const TRANSFORMED = transformSkinCss(PATCHES, { skinId: SKIN_ID, filename: 'patches.css' })

/** The declaration block of the rule whose selector starts a line. */
function block(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+$^{}()|[\]\\]/g, '\\$&')
  const match = new RegExp('^' + escaped + ' \\{', 'm').exec(css)
  expect(match, 'rule not found: ' + selector).not.toBeNull()
  const start = css.indexOf('{', match!.index)
  return css.slice(start + 1, css.indexOf('}', start))
}

describe('furina Windows frame transparency (#78)', () => {
  it('clears the whole-window frame the desktop shell paints opaque', () => {
    // Given the Windows shell paints --dsw-specific-sidebar-fill, alpha .902 in
    // this skin, on its whole-window frame element
    // When the skin's patch stylesheet is read
    // Then the frame is forced transparent, so the -2 illustration shows
    expect(block(PATCHES, FRAME_RULE)).toContain('background: transparent !important')
  })

  it('anchors on the hashed class suffix the host actually emits', () => {
    // The shell's frame class is a CSS-module hash (e.g. BynINW_frame); the
    // suffix form is the one proven on blue-fantasy, maid-atelier and
    // cyber-night, so the four skins stay interchangeable.
    expect(PATCHES).toContain(FRAME_RULE)
  })

  it('touches paint only, never the frame geometry the host owns', () => {
    // Given the frame is the shell's own box
    // When the rule's declarations are read
    // Then nothing but the background is cleared: no height, no position, no
    // z-index, so the host keeps laying the window out (issue #78 asks for the
    // fill alone, and the frame-height note in the skin center docs owns the
    // rest)
    const declarations = block(PATCHES, FRAME_RULE)
      .split(';')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    expect(declarations).toEqual(['background: transparent !important'])
  })

  it('keeps the sidebar fill the frame rule must not neutralize', () => {
    // Given the fix targets only the frame
    // When the token definitions are read
    // Then the sidebar token still holds its near-opaque value (the columns
    // keep their own fill), and the frame rule declares no token
    expect(SKIN).toContain('--dsw-specific-sidebar-fill: #f2f5fae6')
    expect(SKIN).toContain('--dsw-specific-sidebar-fill: #1d2539e6')
    expect(block(PATCHES, FRAME_RULE)).not.toContain('--dsw-specific-sidebar-fill')
  })
})

describe('furina frame fix as the skin-center serves it', () => {
  it('scopes the frame rule into a selector that can match the shell frame', () => {
    // Then the attribute selector survives the prefixing intact, so a hashed
    // BynINW_frame element matches it.
    expect(TRANSFORMED.code).toContain(`${SCOPE} ${FRAME_RULE}`)
  })

  it('reports no fatal diagnostic for the added rule', () => {
    // [class*=] reliance warns, as it does for blue-fantasy, maid-atelier and
    // cyber-night, but nothing in the added rule may fail closed: the
    // stylesheet has to keep serving.
    expect(TRANSFORMED.warnings.filter((w) => w.includes('_frame'))).toEqual([])
  })
})

/**
 * The Windows shell as the browser paints it: the host's illustration layer
 * appended to <body> at -2, and the opaque frame inside #root wrapping the
 * conversation column, with the sidebar the token is also used on.
 */
const WINDOWS_SHELL = '<div data-dsh-skin-layer="background" '
  + 'style="position:absolute;inset:0;z-index:-2"></div>'
  + '<div id="root">'
  + '<div class="BynINW_frame">'
  + '<div class="sidebarCol"></div>'
  + '<div class="conversationCol"></div>'
  + '</div>'
  + '</div>'

/**
 * Computed style of one element under the served stylesheet plus the shell's
 * own fills, with the skin attribute the skin center sets on activation.
 */
function computedUnder(selector: string, hostCss: string): CSSStyleDeclaration {
  document.head.innerHTML = ''
  document.body.innerHTML = WINDOWS_SHELL
  document.documentElement.setAttribute('data-dsh-skin', SKIN_ID)
  document.body.setAttribute('data-ds-dark-theme', '')
  const host = document.createElement('style')
  host.textContent = hostCss
  document.head.append(host)
  const style = document.createElement('style')
  style.textContent = TRANSFORMED.code
  document.head.append(style)
  const element = document.body.querySelector(selector)
  expect(element, 'the fixture must mount ' + selector).not.toBeNull()
  return getComputedStyle(element as Element)
}

describe('furina under the Windows shell', () => {
  it('wins the cascade against the shell frame fill', () => {
    // Given the shell's own near-opaque frame background (the token this skin
    // declares: #f2f5fae6 over the light base)
    // When the frame's computed background-color is read
    // Then the skin's !important transparency wins, so the frame stops
    // covering the illustration
    const shell = '.BynINW_frame { background: rgb(242, 245, 250); }'
    expect(computedUnder('.BynINW_frame', shell).backgroundColor).toBe('rgba(0, 0, 0, 0)')
  })

  it('leaves the sidebar element the token is used on untouched', () => {
    // Given the same shell and the sidebar column inside the frame
    // When the sidebar's computed background-color is read
    // Then it keeps the host's fill, because the fix targets the frame only
    const shell = '.BynINW_frame { background: rgb(242, 245, 250); }'
      + ' .sidebarCol { background: rgb(242, 245, 250); }'
    expect(computedUnder('.sidebarCol', shell).backgroundColor).toBe('rgb(242, 245, 250)')
  })

  it('leaves the illustration layer itself unpainted by the skin', () => {
    // Given the host's own -2 background layer
    // When its computed style is read
    // Then the skin declares no background for it: the artwork is the host's
    // img inside that layer, and clearing the frame is what reveals it
    const shell = '.BynINW_frame { background: rgb(242, 245, 250); }'
    expect(computedUnder('[data-dsh-skin-layer="background"]', shell).backgroundColor)
      .toBe('rgba(0, 0, 0, 0)')
  })
})
