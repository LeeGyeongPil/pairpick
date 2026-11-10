import { describe, expect, it } from 'vitest'
import decisionsJson from '../../../fixtures/decisions.json'
import sample from '../../sample/sample.jsonl?raw'
import { golden } from '../../test/golden.ts'
import { parseJsonl } from '../parse.ts'
import type { Decision } from '../types.ts'
import { toTrlConversational, toTrlKto, toTrlStandard } from './trl.ts'

const { items } = parseJsonl(sample)
const decisions = decisionsJson as Decision[]
const keysOf = (jsonl: string) => jsonl.trimEnd().split('\n').map((l) => Object.keys(JSON.parse(l)).sort())

describe('TRL export', () => {
  it('standard preference matches the golden file byte for byte', () => {
    const out = toTrlStandard(items, decisions)
    expect(out).toBe(golden('trl_standard.jsonl', out))
    for (const k of keysOf(out)) expect(k).toEqual(['chosen', 'prompt', 'rejected'])
  })

  it('conversational preference matches the golden file', () => {
    const out = toTrlConversational(items, decisions)
    expect(out).toBe(golden('trl_conversational.jsonl', out))
    const first = JSON.parse(out.split('\n')[0] ?? '{}')
    expect(first.prompt).toEqual([{ role: 'user', content: 'What is the capital of France?' }])
    expect(first.chosen[0].role).toBe('assistant')
  })

  it('KTO unpaired matches the golden file and labels are booleans', () => {
    const out = toTrlKto(items, decisions)
    expect(out).toBe(golden('trl_kto.jsonl', out))
    for (const k of keysOf(out)) expect(k).toEqual(['completion', 'label', 'prompt'])
    for (const l of out.trimEnd().split('\n')) expect(typeof JSON.parse(l).label).toBe('boolean')
  })

  it('writes rows in original row order and drops ties and skips', () => {
    const lines = toTrlStandard(items, decisions).trimEnd().split('\n')
    // picks: s01, s02, s07, s10, s11, s12 (decision order was shuffled, s03 tie, s04 skip)
    expect(lines).toHaveLength(6)
    expect(JSON.parse(lines[0] ?? '').prompt).toBe('What is the capital of France?')
    expect(JSON.parse(lines[5] ?? '').prompt).toBe('Name a primary color.')
  })

  it('flattens multi-turn prompts to text in the standard format', () => {
    const multi = toTrlStandard(items, decisions).split('\n').map((l) => l && JSON.parse(l).prompt)
    expect(multi).toContain('user: I need a quick snack idea.\nassistant: Do you prefer sweet or salty?\nuser: Salty, please.')
  })

  it('returns an empty string when nothing was picked', () => {
    expect(toTrlStandard(items, [])).toBe('')
    expect(toTrlKto(items, [{ id: 's03', choice: 'tie', shownLeft: 0 }])).toBe('')
  })
})
