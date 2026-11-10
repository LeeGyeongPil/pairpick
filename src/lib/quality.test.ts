import { describe, expect, it } from 'vitest'
import sample from '../sample/sample.jsonl?raw'
import { parseJsonl } from './parse.ts'
import { qualityWarnings, warningLabel } from './quality.ts'

describe('qualityWarnings on the bundled sample', () => {
  const { items, errors } = parseJsonl(sample)
  const warnings = qualityWarnings(items)
  const idsWith = (kind: string) =>
    items.filter((it) => warnings.get(it.id)?.some((w) => w.kind === kind)).map((it) => it.id)

  it('parses cleanly with 12 rows', () => {
    expect(errors).toEqual([])
    expect(items).toHaveLength(12)
  })

  it('flags each warning only on the expected rows', () => {
    expect(idsWith('identical')).toEqual(['s05'])
    expect(idsWith('empty')).toEqual(['s06'])
    expect(idsWith('length')).toEqual(['s07'])
    expect(idsWith('duplicatePrompt')).toEqual(['s08', 's09'])
  })

  it('leaves normal rows without any warning', () => {
    for (const id of ['s01', 's02', 's03', 's04', 's10', 's11', 's12']) expect(warnings.has(id)).toBe(false)
  })

  it('describes warnings in Korean badge text', () => {
    expect(warningLabel({ kind: 'length', ratio: 4.25 })).toBe('길이 4.3배 차이')
    expect(warningLabel({ kind: 'duplicatePrompt', count: 2 })).toBe('같은 프롬프트가 2번 나옴')
  })
})
