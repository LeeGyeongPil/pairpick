import { describe, expect, it } from 'vitest'
import ab from '../../fixtures/inputs/ab.jsonl?raw'
import array from '../../fixtures/inputs/array.json?raw'
import broken from '../../fixtures/inputs/broken.jsonl?raw'
import chosenRejected from '../../fixtures/inputs/chosen_rejected.jsonl?raw'
import responses from '../../fixtures/inputs/responses.jsonl?raw'
import sample from '../sample/sample.jsonl?raw'
import { parseJsonl } from './parse.ts'

describe('JSON array input', () => {
  it('reads an indented array with the same row rules as JSONL', () => {
    const r = parseJsonl(array)
    expect(r.format).toBe('json-array')
    expect(r.items.map((i) => i.id)).toEqual(['a1', '2', 'a1#3'])
    expect(r.items.map((i) => i.line)).toEqual([1, 2, 3])
    expect(r.errors).toHaveLength(1)
    expect(r.errors[0]?.line).toBe(4)
    expect(r.errors[0]?.message).toMatch(/array item/)
    expect(r.errors[0]?.keys).toEqual([])
    expect(r.shape).toBe('responses')
  })

  it('treats [] as an empty array without errors', () => {
    const r = parseJsonl('[]')
    expect(r).toEqual({ items: [], errors: [], shape: null, format: 'json-array' })
  })

  it('accepts a BOM before the array', () => {
    expect(parseJsonl('﻿[{"prompt":"p","responses":["a","b"]}]').format).toBe('json-array')
  })

  it('reports an indented single object once instead of once per line', () => {
    const r = parseJsonl('{\n  "data": [\n    1\n  ]\n}\n')
    expect(r.errors).toHaveLength(1)
    expect(r.errors[0]?.line).toBe(1)
    expect(r.errors[0]?.keys).toEqual(['data'])
    expect(r.errors[0]?.message).toMatch(/single JSON object/)
    expect(r.format).toBeUndefined()
  })
})

describe('JSONL stays unchanged', () => {
  it('has no format key and keeps ids and lines', () => {
    for (const text of [responses, ab, chosenRejected, broken, sample]) {
      const r = parseJsonl(text)
      expect('format' in r).toBe(false)
      for (const it of r.items) expect(it.id === String(it.line) || it.id.length > 0).toBe(true)
    }
    expect(parseJsonl(broken).items.map((i) => i.line)).toEqual([1, 4, 5, 7])
  })

  it('reads a one-line object file as one row', () => {
    const r = parseJsonl('{"prompt":"p","responses":["a","b"]}')
    expect(r.items).toHaveLength(1)
    expect(r.errors).toEqual([])
    expect('format' in r).toBe(false)
  })

  it('keeps empty and whitespace-only input as no items, no errors', () => {
    for (const t of ['', '  \n\n \r\n']) {
      expect(parseJsonl(t)).toEqual({ items: [], errors: [], shape: null })
    }
  })

  it('still reports a broken array start as per-line errors (falls back to JSONL)', () => {
    const r = parseJsonl('[{"prompt":\n')
    expect(r.format).toBeUndefined()
    expect(r.errors.length).toBeGreaterThan(0)
  })

  it('keeps a one-line scalar on the JSONL path', () => {
    expect(parseJsonl('42').errors[0]?.message).toBe('each line must be a JSON object')
  })
})
