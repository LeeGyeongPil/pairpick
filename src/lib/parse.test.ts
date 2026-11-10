import { describe, expect, it } from 'vitest'
import ab from '../../fixtures/inputs/ab.jsonl?raw'
import broken from '../../fixtures/inputs/broken.jsonl?raw'
import chosenRejected from '../../fixtures/inputs/chosen_rejected.jsonl?raw'
import responses from '../../fixtures/inputs/responses.jsonl?raw'
import { parseJsonl } from './parse.ts'

describe('parseJsonl', () => {
  it('reports broken and unrecognized lines with 1-based line numbers and keys', () => {
    const r = parseJsonl(broken)
    expect(r.items).toHaveLength(4)
    expect(r.errors.map((e) => e.line)).toEqual([3, 6])
    expect(r.errors[0]?.message).toMatch(/invalid JSON/)
    expect(r.errors[1]?.keys).toEqual(['foo', 'bar'])
    expect(r.items.map((i) => i.line)).toEqual([1, 4, 5, 7])
    expect(r.shape).toBe('responses')
  })

  it('handles BOM, CRLF and blank lines', () => {
    const r = parseJsonl('﻿{"prompt":"p","responses":["a","b"]}\r\n\r\n\r\n{"prompt":"q","responses":["c","d"]}\r\n')
    expect(r.errors).toEqual([])
    expect(r.items.map((i) => i.id)).toEqual(['1', '4'])
  })

  it('detects the three input shapes', () => {
    expect(parseJsonl(responses).shape).toBe('responses')
    expect(parseJsonl(ab).shape).toBe('ab')
    const cr = parseJsonl(chosenRejected)
    expect(cr.shape).toBe('chosen_rejected')
    expect(cr.items[0]?.responses).toEqual(['good1', 'bad1'])
  })

  it('reads string and message-list prompts, uses line numbers as ids when id is missing', () => {
    const r = parseJsonl(responses)
    expect(r.items[1]?.prompt).toEqual([{ role: 'user', content: 'Q2' }])
    expect(r.items[1]?.responses).toHaveLength(3)
    expect(parseJsonl(ab).items.map((i) => i.id)).toEqual(['b1', '2'])
  })

  it('keeps ids unique when the file repeats an id', () => {
    const r = parseJsonl('{"id":"x","prompt":"p","responses":["a","b"]}\n{"id":"x","prompt":"p","responses":["a","c"]}\n')
    expect(new Set(r.items.map((i) => i.id)).size).toBe(2)
  })

  it('rejects rows with a bad prompt, too few responses, or non-object lines', () => {
    const r = parseJsonl('{"responses":["a","b"]}\n{"prompt":"p","responses":["a"]}\n[1,2]\n{"prompt":"p","responses":["a",2]}\n')
    expect(r.items).toEqual([])
    expect(r.errors.map((e) => e.line)).toEqual([1, 2, 3, 4])
    expect(r.shape).toBeNull()
  })

  it('returns an empty result for empty text', () => {
    expect(parseJsonl('')).toEqual({ items: [], errors: [], shape: null })
  })
})
