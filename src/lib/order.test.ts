import { describe, expect, it } from 'vitest'
import { fingerprint, fnv1a64 } from './hash.ts'
import { shownLeft } from './order.ts'

describe('hash', () => {
  it('matches the FNV-1a 64 reference values', () => {
    expect(fnv1a64('')).toBe('cbf29ce484222325')
    expect(fnv1a64('a')).toBe('af63dc4c8601ec8c')
  })
  it('ignores BOM and CRLF in the fingerprint', () => {
    expect(fingerprint('﻿a\r\nb\r\n')).toBe(fingerprint('a\nb\n'))
    expect(fingerprint('a\nb\n')).not.toBe(fingerprint('a\nc\n'))
  })
})

describe('shownLeft', () => {
  it('is deterministic for the same (fingerprint, id)', () => {
    for (let i = 0; i < 20; i++) expect(shownLeft('fp1', 'row' + i)).toBe(shownLeft('fp1', 'row' + i))
  })
  it('puts either response on the left roughly half of the time', () => {
    let left0 = 0
    for (let i = 0; i < 100; i++) if (shownLeft('0123456789abcdef', String(i)) === 0) left0++
    expect(left0 / 100).toBeGreaterThanOrEqual(0.3)
    expect(left0 / 100).toBeLessThanOrEqual(0.7)
  })
  it('changes with the file fingerprint', () => {
    const a = Array.from({ length: 50 }, (_, i) => shownLeft('fpA', String(i)))
    const b = Array.from({ length: 50 }, (_, i) => shownLeft('fpB', String(i)))
    expect(a).not.toEqual(b)
  })
})
