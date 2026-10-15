// @vitest-environment jsdom

/**
 * Semantic adapter re-anchoring (issue #1732).
 *
 * The adapter's first pass stamps whole trees, but a rule can key on an
 * ANCESTOR of the node that arrives: the plugin sidebar row is recognised by
 * the glyph inside it, and the shell mounts the row before the registering
 * plugin paints that glyph. This spec pins both late-arrival orders, so a row
 * is never left unanchored until something forces a full pass.
 */

import { describe, expect, it } from 'vitest'

import { createSemanticAdapter, SEMANTIC_RULES_V1 } from '../src/client/runtime/semantic-adapter.ts'

/** One observer callback turn. */
const settle = (): Promise<void> => new Promise((resolve) => { setTimeout(resolve, 0) })

describe('semantic adapter late anchors (issue #1732)', () => {
  it('a plugin row mounted before its glyph is anchored when the glyph arrives', async () => {
    // Given a shell panel row whose glyph slot is still empty
    document.body.innerHTML = '<nav class="shell_panelList_hash">'
      + '<button class="shell_panelRow_hash"><span class="shell_panelGlyph_hash"></span></button></nav>'
    const adapter = createSemanticAdapter(document)
    adapter.start()
    const row = document.querySelector('[class*="panelRow"]')!
    expect(row.getAttribute('data-dsh-part'), 'the empty row has no glyph yet').toBeNull()

    // When the registering plugin paints its glyph inside that row
    const glyph = document.createElement('svg')
    glyph.setAttribute('data-dsh-panel-entry', 'task-board')
    row.querySelector('span')!.appendChild(glyph)
    await settle()

    // Then the row is a sidebar entry without any full pass having run
    expect(row.getAttribute('data-dsh-part')).toBe('sidebar-entry')
    adapter.stop()
  })

  it('a glyph anchor set on an existing node re-anchors its row', async () => {
    // Given a row carrying a glyph element that has no anchor yet
    document.body.innerHTML = '<nav class="shell_panelList_hash">'
      + '<button class="shell_panelRow_hash"><span class="shell_panelGlyph_hash"><svg></svg></span></button></nav>'
    const adapter = createSemanticAdapter(document)
    adapter.start()
    const row = document.querySelector('[class*="panelRow"]')!
    const glyph = row.querySelector('svg')!
    expect(row.getAttribute('data-dsh-part'), 'an unmarked glyph marks nothing').toBeNull()

    // When a re-render flips the anchor attribute instead of replacing the node
    glyph.setAttribute('data-dsh-panel-entry', 'ssh')
    await settle()

    // Then the ancestor row is re-evaluated exactly like a newly inserted one
    expect(row.getAttribute('data-dsh-part')).toBe('sidebar-entry')
    adapter.stop()
  })

  it('a symbol mounted inside a component re-anchors the component itself', async () => {
    // Given a mounted plugin panel that has not painted its own root anchor yet
    document.body.innerHTML = '<div class="host_centerCol_hash"><section class="ssh_shell_hash"></section></div>'
    const adapter = createSemanticAdapter(document)
    adapter.start()
    const shell = document.querySelector('[class*="ssh_shell"]')!
    expect(shell.getAttribute('data-dsh-plugin')).toBeNull()

    // When the panel paints its stable root anchor inside itself
    const view = document.createElement('div')
    view.setAttribute('data-dsh-ssh-view', '')
    shell.appendChild(view)
    await settle()

    // Then the ordinary descendant rule still lands (the ancestor walk does
    // not replace applyToTree, it complements it)
    expect(view.getAttribute('data-dsh-plugin')).toBe('ssh')
    adapter.stop()
  })

  it('anchors a row whose glyph sits deep inside a wrapper chain', async () => {
    // Given a panel row whose glyph is wrapped by several layout divs
    // (the shell's own row is three hops deep; deeper markup must not become a
    // cliff, which is exactly the defect this walk exists to fix)
    const wrappers = 12
    document.body.innerHTML = '<nav class="shell_panelList_hash">'
      + '<button class="shell_panelRow_hash"><span class="shell_panelGlyph_hash"></span></button></nav>'
    const adapter = createSemanticAdapter(document)
    adapter.start()
    const row = document.querySelector('[class*="panelRow"]')!

    // When the glyph arrives at the bottom of a nested wrapper chain
    let host: Element = row.querySelector('span')!
    for (let i = 0; i < wrappers; i += 1) {
      const wrapper = document.createElement('div')
      host.appendChild(wrapper)
      host = wrapper
    }
    const glyph = document.createElement('svg')
    glyph.setAttribute('data-dsh-panel-entry', 'task-board')
    host.appendChild(glyph)
    await settle()

    // Then the row is still anchored (spare depth is left by design)
    expect(row.getAttribute('data-dsh-part')).toBe('sidebar-entry')
    adapter.stop()
  })

  it('stopping the adapter leaves no observer behind for late anchors', async () => {
    // Given a stopped adapter
    document.body.innerHTML = '<nav class="shell_panelList_hash">'
      + '<button class="shell_panelRow_hash"><span class="shell_panelGlyph_hash"></span></button></nav>'
    const adapter = createSemanticAdapter(document)
    adapter.start()
    adapter.stop()
    const row = document.querySelector('[class*="panelRow"]')!

    // When a glyph arrives after the stop
    const glyph = document.createElement('svg')
    glyph.setAttribute('data-dsh-panel-entry', 'task-board')
    row.querySelector('span')!.appendChild(glyph)
    await settle()

    // Then nothing stamps it
    expect(row.getAttribute('data-dsh-part')).toBeNull()
  })
})

describe('semantic adapter match batching (issue #1870)', () => {
  /**
   * A session switch mounts a whole message column in one delivery. The rows
   * land in the SAME deep wrapper chain, so every record of that delivery
   * shares the same ~21 ancestors. The pre-fix implementation walked those
   * ancestors once per added node with the whole rule table, and then walked
   * them again for every attribute record its own stamping generated.
   *
   * LEGACY_STORM_MATCHES is that implementation measured on this fixture:
   * 242,880 matches() calls, deterministic across runs. The batching
   * implementation measures 15,600, of which 5,760 are the per-root rule
   * application the adapter has always done and the remainder is jsdom's own
   * selector engine answering the per-rule querySelectorAll.
   */
  const STORM_ROWS = 240
  const STORM_DEPTH = 18
  const LEGACY_STORM_MATCHES = 242_880
  /** Cells a filled panel row mounts into itself, in the same delivery. */
  const NESTED_CELLS = 20

  /** Counts Element.matches() for the duration of one body of work. */
  const countMatches = async (work: () => Promise<void>): Promise<number> => {
    const original = Element.prototype.matches
    let calls = 0
    Element.prototype.matches = function counted(this: Element, selector: string): boolean {
      calls += 1
      return original.call(this, selector)
    }
    try {
      await work()
    } finally {
      Element.prototype.matches = original
    }
    return calls
  }

  /** A shell conversation column wrapped to the depth real markup reaches. */
  const stormColumn = (): Element => {
    document.body.innerHTML = '<div data-slot="root"><div data-slot="conversation"></div></div>'
    let host = document.querySelector('[data-slot="conversation"]')!
    for (let depth = 0; depth < STORM_DEPTH; depth += 1) {
      const wrapper = document.createElement('div')
      host.appendChild(wrapper)
      host = wrapper
    }
    return host
  }

  /** Mount a session switch's rows in ONE observer delivery. */
  const mountSessionRows = (column: Element): Element[] => {
    const rows: Element[] = []
    const fragment = document.createDocumentFragment()
    for (let index = 0; index < STORM_ROWS; index += 1) {
      const row = document.createElement('div')
      row.setAttribute('data-chat-flow-kind', 'message')
      const label = document.createElement('span')
      label.textContent = String(index)
      row.appendChild(label)
      fragment.appendChild(row)
      rows.push(row)
    }
    column.appendChild(fragment)
    return rows
  }

  it('costs one narrowed ancestor pass per unique ancestor instead of one per node', async () => {
    // Given a started adapter and an empty conversation column
    document.body.innerHTML = ''
    const adapter = createSemanticAdapter(document)
    adapter.start()
    const column = stormColumn()
    await settle()

    // When a session switch mounts the whole message column in one delivery
    const calls = await countMatches(async () => {
      mountSessionRows(column)
      await settle()
      await settle()
    })

    // Then the batch costs an order of magnitude less than the per-node walk
    // did, and the encoded bound is itself an order of magnitude under the
    // legacy measurement the pre-fix implementation produced
    expect(calls, 'the storm bound the pre-fix implementation violates by 10x')
      .toBeLessThanOrEqual(LEGACY_STORM_MATCHES / 10)
    expect(calls, 'a tight bound: per-root work plus headroom, nothing per node')
      .toBeLessThanOrEqual(20_000)
    adapter.stop()
  })

  it('stamps exactly what the per-node walk stamped on the same fixture', async () => {
    // Given the same started adapter and the same session switch
    document.body.innerHTML = ''
    const adapter = createSemanticAdapter(document)
    adapter.start()
    const column = stormColumn()
    await settle()

    // When the rows are mounted
    const rows = mountSessionRows(column)
    await settle()
    await settle()

    // Then every row carries the part its rule promises, the column outlets
    // carry their surfaces, and nothing else is stamped: the exact 242 stamped
    // attributes the pre-fix implementation produced on this fixture
    const stamped: string[] = []
    const collect = (el: Element): void => {
      for (const name of ['data-dsh-surface', 'data-dsh-part', 'data-dsh-plugin'] as const) {
        const value = el.getAttribute(name)
        if (value !== null) stamped.push(name + '=' + value)
      }
      for (const child of Array.from(el.children)) collect(child)
    }
    collect(document.body)
    expect(rows.every((row) => row.getAttribute('data-dsh-part') === 'message-row')).toBe(true)
    expect(document.querySelector('[data-slot="root"]')!.getAttribute('data-dsh-surface')).toBe('root')
    expect(document.querySelector('[data-slot="conversation"]')!.getAttribute('data-dsh-surface')).toBe('conversation')
    expect(stamped.filter((entry) => entry === 'data-dsh-part=message-row')).toHaveLength(STORM_ROWS)
    expect(stamped).toHaveLength(STORM_ROWS + 2)
    adapter.stop()
  })

  it('scans a subtree mounted in one delivery once, not once per added node', async () => {
    // Given a started adapter on a panel list with no rows yet
    document.body.innerHTML = '<nav class="shell_panelList_hash"></nav>'
    const adapter = createSemanticAdapter(document)
    adapter.start()
    const list = document.querySelector('[class*="panelList"]')!
    await settle()
    const row = document.createElement('button')
    row.className = 'shell_panelRow_hash'
    const glyph = document.createElement('svg')
    glyph.setAttribute('data-dsh-panel-entry', 'ssh')
    row.appendChild(glyph)

    // When the row lands and is then filled, all inside one delivery: the
    // cells are added roots contained in another added root of the same batch
    const calls = await countMatches(async () => {
      list.appendChild(row)
      for (let cellIndex = 0; cellIndex < NESTED_CELLS; cellIndex += 1) {
        const cell = document.createElement('div')
        cell.setAttribute('data-cell', String(cellIndex))
        for (let leafIndex = 0; leafIndex < 3; leafIndex += 1) {
          const leaf = document.createElement('span')
          leaf.setAttribute('data-leaf', String(leafIndex))
          cell.appendChild(leaf)
        }
        row.appendChild(cell)
      }
      await settle()
      await settle()
    })

    // Then the row is anchored and no nested root was scanned a second time
    // (the pre-fix implementation measured 1,978 calls on this fixture)
    expect(row.getAttribute('data-dsh-part')).toBe('sidebar-entry')
    expect(calls).toBeLessThanOrEqual(200)
    adapter.stop()
  })

  it('a stamping echo costs zero rule evaluations', async () => {
    // Given a rule table that must stay blind to the adapter's own output,
    // because the observer's attribute filter also reports what it stamps
    const written = new Set(SEMANTIC_RULES_V1.flatMap((rule) => rule.attrs.map(([name]) => name)))
    expect([...written].sort()).toEqual(['data-dsh-part', 'data-dsh-plugin', 'data-dsh-surface'])
    for (const rule of SEMANTIC_RULES_V1) {
      for (const name of written) {
        expect(rule.selector, 'a rule reading adapter output would echo')
          .not.toContain('[' + name)
      }
    }
    document.body.innerHTML = '<div id="host"></div>'
    const adapter = createSemanticAdapter(document)
    adapter.start()
    await settle()
    const host = document.querySelector('#host')!

    // Given an identical mount that the rule table stamps
    const stamped = await countMatches(async () => {
      const tail = document.createElement('div')
      tail.setAttribute('data-turn-tail', '')
      host.appendChild(tail)
      await settle()
    })
    expect(host.querySelector('div')!.getAttribute('data-dsh-part')).toBe('turn-tail')

    // And an identical mount that no rule matches, so it stamps nothing and
    // therefore produces no attribute record of its own
    const unstamped = await countMatches(async () => {
      const plain = document.createElement('div')
      plain.setAttribute('data-unknown-anchor', '')
      host.appendChild(plain)
      await settle()
    })

    // Then the attribute record the stamp generated costs zero matches(): the
    // stamped mount costs exactly what the silent one costs
    expect(stamped).toBe(unstamped)
    expect(stamped, 'and neither mount is expensive in the first place')
      .toBeLessThanOrEqual(60)
    adapter.stop()
  })

  it('a self-only attribute change still stamps the rule naming that attribute', async () => {
    // Given a composer textarea already in the tree with no phase attribute
    document.body.innerHTML = '<div data-slot="conversation.composer"><textarea></textarea></div>'
    const adapter = createSemanticAdapter(document)
    adapter.start()
    const textarea = document.querySelector('textarea')!
    await settle()
    expect(textarea.getAttribute('data-dsh-part')).toBeNull()

    // When the shell flips its phase attribute on that existing node
    textarea.setAttribute('data-phase', 'streaming')
    await settle()

    // Then the rule naming data-phase still runs on the target itself
    expect(textarea.getAttribute('data-dsh-part')).toBe('composer-input')
    adapter.stop()
  })

  it('a late data-slot flip makes an ancestor dialog match its :has() rule', async () => {
    // Given a mounted settings dialog whose section outlet has not arrived
    document.body.innerHTML = '<div role="dialog" id="settings"></div>'
    const adapter = createSemanticAdapter(document)
    adapter.start()
    const dialog = document.querySelector('#settings')!
    await settle()
    expect(dialog.getAttribute('data-dsh-surface')).toBeNull()

    // When the section outlet is appended into the dialog
    const section = document.createElement('div')
    section.setAttribute('data-slot', 'settings.section')
    dialog.appendChild(section)
    await settle()

    // Then the descendant-sensitive rule re-anchors the ancestor
    expect(dialog.getAttribute('data-dsh-surface')).toBe('settings')
    adapter.stop()
  })

  it('re-anchors a row whose glyph anchor lands a tick after the row itself', async () => {
    // Given a shell panel row mounted with an empty glyph slot
    document.body.innerHTML = '<nav class="shell_panelList_hash">'
      + '<button class="shell_panelRow_hash"><span class="shell_panelGlyph_hash"></span></button></nav>'
    const adapter = createSemanticAdapter(document)
    adapter.start()
    const row = document.querySelector('[class*="panelRow"]')!
    await settle()

    // When the registering plugin paints its glyph inside that row
    const glyph = document.createElement('svg')
    glyph.setAttribute('data-dsh-panel-entry', 'task-board')
    row.querySelector('span')!.appendChild(glyph)
    await settle()

    // Then the late descendant still re-anchors the ancestor row
    expect(row.getAttribute('data-dsh-part')).toBe('sidebar-entry')
    adapter.stop()
  })
})
