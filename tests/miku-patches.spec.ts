/**
 * miku session-header band guards (issue #71).
 *
 * The skin declares a full-viewport illustration plus a scrim gradient
 * (`contributes.backgroundMedia.light.scrim`, alpha 0.50 at the top). The
 * session header then paints a second translucent layer on
 * `[data-slot='conversation.header'] > header`, so what a user sees over the
 * artwork is the product of the two:
 *
 *   composed = 1 - (1 - scrim) * (1 - band)
 *
 * The shipped values (#fbfdffe0 / #fbfdffb8 = 0.878 / 0.722) composed to
 * 0.94 -> 0.86, an opaque plate. The host renders that header even on the
 * empty hero screen, where it is the only thing covering the artwork, so its
 * hard lower edge cut the illustration's top 40 CSS px in two.
 *
 * Each value is a single declaration an unrelated edit could silently restore,
 * so this spec pins the declarations, the design language around them (a band
 * plus its hairline, not a mask), and the composed opacity they produce over
 * the scrim the manifest actually declares, for both themes.
 */

// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { transformSkinCss } from '../src/core/css-safety/transform.ts'

// Path-based like the other jsdom specs: under the jsdom environment the URL
// base of import.meta.url is not a file: URL, so resolving from __dirname is
// the stable form.
const SKIN_ID = 'miku'
const SCOPE = `html[data-dsh-skin="${SKIN_ID}"]`
const LIGHT_HEAD = "[data-slot='conversation.header'] > header"
const DARK_HEAD = "body[data-ds-dark-theme] [data-slot='conversation.header'] > header"
const DIR = resolve(__dirname, '../skins/miku')
const CSS = readFileSync(resolve(DIR, 'patches.css'), 'utf8')
const TRANSFORMED = transformSkinCss(CSS, { skinId: SKIN_ID, filename: 'patches.css' })
const MANIFEST = JSON.parse(readFileSync(resolve(DIR, 'skin.json'), 'utf8')) as {
  contributes: { backgroundMedia: Record<'light' | 'dark', { scrim: string }> }
}

/** The declaration block of the rule whose selector list starts with `head`. */
function block(head: string): string {
  const escaped = head.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp('^' + escaped + ',?$', 'm').exec(CSS)
  expect(match, 'rule not found: ' + head).not.toBeNull()
  const start = CSS.indexOf('{', match!.index)
  return CSS.slice(start + 1, CSS.indexOf('}', start))
}

interface Stop {
  hex: string
  a: number
}

/** The band gradient's own stops, as authored (#rrggbbaa). */
function bandStops(head: string): Stop[] {
  const declarations = block(head)
  expect(declarations, 'the band rule must declare a gradient').toContain('background: linear-gradient(180deg,')
  return [...declarations.matchAll(/#([0-9a-f]{6})([0-9a-f]{2})\b/gi)].map((m) => ({
    hex: m[0].toLowerCase(),
    a: parseInt(m[2], 16) / 255,
  }))
}

/** Alpha of the scrim's first stop, the layer the band is composited onto. */
function scrimTopAlpha(theme: 'light' | 'dark'): number {
  const scrim = MANIFEST.contributes.backgroundMedia[theme].scrim
  const match = /rgba\([^)]*,\s*([\d.]+)\)\s*0%/.exec(scrim)
  expect(match, 'the scrim must start with an rgba() stop at 0%').not.toBeNull()
  return Number(match![1])
}

/** What is left of the artwork after both translucent layers were painted over it. */
function composedOpacity(scrim: number, band: number): number {
  return 1 - (1 - scrim) * (1 - band)
}

/**
 * The ceiling a band may reach before it stops being a veil and becomes a
 * mask. The shipped light band composed to 0.94 and its dark counterpart to
 * 0.86; each ceiling sits a little above the fixed values, so a slightly
 * stronger tint can still pass while the mask cannot come back.
 */
const MAX_COMPOSED = { light: 0.7, dark: 0.45 } as const

/** How much opacity the band may add on top of the scrim alone. */
const MAX_ADDED = 0.125

/**
 * Ceiling for one authored stop, expressed in 8-bit alpha so the boundary is
 * exact: the darkest fixed stop is #0e1a2b4d (77/255 = 0.302).
 */
const MAX_STOP_ALPHA = 0x4d / 255

describe('miku session-header band: authored translucency (#71)', () => {
  it('pins the light band to a truly translucent pair', () => {
    // Given the skin's patch stylesheet
    // When the light band rule is read
    // Then both stops stay far below the 0.88 / 0.72 that shipped the bug
    expect(bandStops(LIGHT_HEAD).map((s) => s.hex)).toEqual(['#fbfdff3d', '#fbfdff14'])
  })

  it('pins the dark band to a truly translucent pair', () => {
    // Given the same stylesheet
    // When the dark band rule is read
    // Then it is translucent too: 0.30 -> 0.12, not the 0.85 / 0.66 that shipped
    expect(bandStops(DARK_HEAD).map((s) => s.hex)).toEqual(['#0e1a2b4d', '#0e1a2b1f'])
  })

  it('keeps the band translucent in both themes rather than absent or opaque', () => {
    // Given both band rules
    // When their stop alphas are read
    // Then every stop stays in the veil range: above zero (the band is the
    // skin's design language) and at most the darkest fixed stop, so the
    // artwork still shows through it
    for (const head of [LIGHT_HEAD, DARK_HEAD]) {
      for (const stop of bandStops(head)) {
        expect(stop.a, head + ' stop ' + stop.hex).toBeGreaterThan(0)
        expect(stop.a, head + ' stop ' + stop.hex).toBeLessThanOrEqual(MAX_STOP_ALPHA)
      }
    }
  })

  it('keeps the hairline that closes the band', () => {
    // Given the band rule
    // When its declarations are read
    // Then the design language survives: a translucent band plus one hairline,
    // which is a deliberate 1px line rather than a 40px mask
    expect(block(LIGHT_HEAD)).toContain('border-bottom: 1px solid var(--miku-hairline) !important')
  })
})

describe('miku session-header band: composed opacity over the declared scrim (#71)', () => {
  it('keeps the light band continuous with the scrim below it', () => {
    // Given the manifest's light scrim (0.50 at the top)
    // When the band's bottom stop is composited onto it
    // Then the seam to the bare scrim is a few percent, not the 0.36 that made
    // the illustration's top edge a hard line
    const scrim = scrimTopAlpha('light')
    const stops = bandStops(LIGHT_HEAD)
    const top = composedOpacity(scrim, stops[0].a)
    const bottom = composedOpacity(scrim, stops[stops.length - 1].a)
    expect(top).toBeLessThanOrEqual(MAX_COMPOSED.light)
    expect(bottom).toBeLessThanOrEqual(MAX_COMPOSED.light)
    expect(bottom - scrim).toBeLessThanOrEqual(MAX_ADDED)
    expect(top).toBeGreaterThan(scrim)
  })

  it('keeps the dark band continuous with the scrim below it', () => {
    // Given the manifest's dark scrim (0.12 at the top)
    // When the band's bottom stop is composited onto it
    // Then it adds a tenth of an alpha point, where the shipped pair added 0.58
    const scrim = scrimTopAlpha('dark')
    const stops = bandStops(DARK_HEAD)
    const top = composedOpacity(scrim, stops[0].a)
    const bottom = composedOpacity(scrim, stops[stops.length - 1].a)
    expect(top).toBeLessThanOrEqual(MAX_COMPOSED.dark)
    expect(bottom).toBeLessThanOrEqual(MAX_COMPOSED.dark)
    expect(bottom - scrim).toBeLessThanOrEqual(MAX_ADDED)
    expect(top).toBeGreaterThan(scrim)
  })

  it('would have rejected the pair the report measured', () => {
    // Given the shipped light top stop (#fbfdffe0 = 0.878) over the 0.50 scrim
    // When it is composited
    // Then the ceilings above fail it, so the guard is not vacuous
    const shipped = composedOpacity(0.5, 0xe0 / 255)
    expect(shipped).toBeCloseTo(0.939, 3)
    expect(shipped).toBeGreaterThan(MAX_COMPOSED.light)
    expect(shipped - 0.5).toBeGreaterThan(MAX_ADDED)
  })
})

describe('miku session-header band as the skin center serves it (#71)', () => {
  it('scopes the band under the skin attribute', () => {
    // Given the /patches transform the skin center applies on every activation
    // When the band selector is looked up in the output
    // Then it is force-scoped, so it cannot reach a host without the skin active
    expect(TRANSFORMED.code).toContain(SCOPE + ' ' + LIGHT_HEAD)
  })

  it('serves the translucent gradient, not the masked one', () => {
    // Given the transformed stylesheet
    // When the scoped band rule is read
    // Then the served bytes carry the pinned gradient
    const start = TRANSFORMED.code.indexOf(SCOPE + ' ' + LIGHT_HEAD)
    expect(start).toBeGreaterThanOrEqual(0)
    const declarations = TRANSFORMED.code.slice(
      TRANSFORMED.code.indexOf('{', start) + 1,
      TRANSFORMED.code.indexOf('}', start),
    )
    expect(declarations).toContain('linear-gradient(180deg, #fbfdff3d 0%, #fbfdff14 100%)')
  })

  it('reports no scoping or whitelist diagnostics for the band rules', () => {
    // Given the transform the loader runs
    // When its warnings are read
    // Then the band rules fail nothing closed: the stylesheet keeps serving
    expect(TRANSFORMED.warnings.filter((warning) => warning.includes('conversation'))).toEqual([])
  })
})
