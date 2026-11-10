import { describe, expect, it } from 'vitest'
import decisionsJson from '../../../fixtures/decisions.json'
import sample from '../../sample/sample.jsonl?raw'
import { golden } from '../../test/golden.ts'
import { parseJsonl } from '../parse.ts'
import type { Decision } from '../types.ts'
import { toAlpaca, toDatasetInfo } from './llamafactory.ts'

const { items } = parseJsonl(sample)
const decisions = decisionsJson as Decision[]

describe('LLaMA-Factory export', () => {
  it('alpaca preference matches the golden file and reports the excluded multi-turn row', () => {
    const out = toAlpaca(items, decisions)
    expect(out.json).toBe(golden('llamafactory_alpaca.json', out.json))
    expect(out.written).toBe(5)
    expect(out.excluded).toBe(1) // s11 has three turns
    for (const row of JSON.parse(out.json)) expect(Object.keys(row)).toEqual(['instruction', 'input', 'chosen', 'rejected'])
  })

  it('unwraps a single-message prompt into the instruction', () => {
    const rows = JSON.parse(toAlpaca(items, decisions).json)
    expect(rows.map((r: { instruction: string }) => r.instruction)).toContain("Translate 'good morning' into Korean.")
  })

  it('dataset_info fragment matches the golden file', () => {
    const out = toDatasetInfo('pairpick_preference', 'llamafactory_alpaca.json')
    expect(out).toBe(golden('dataset_info.json', out))
    const info = JSON.parse(out).pairpick_preference
    expect(info.ranking).toBe(true)
    expect(info.columns).toEqual({ prompt: 'instruction', query: 'input', chosen: 'chosen', rejected: 'rejected' })
  })

  it('handles nothing picked', () => {
    expect(toAlpaca(items, [])).toEqual({ json: '[]\n', written: 0, excluded: 0 })
  })
})
