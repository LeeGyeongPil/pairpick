import type { Item, Msg, ParseError, ParseResult, Prompt, Shape } from './types.ts'

function isMsgList(v: unknown): v is Msg[] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every(
      (m) =>
        typeof m === 'object' && m !== null && typeof (m as Msg).role === 'string' && typeof (m as Msg).content === 'string',
    )
  )
}

function isPrompt(v: unknown): v is Prompt {
  return typeof v === 'string' || isMsgList(v)
}

type Found = { shape: Shape; responses: string[] } | { error: string }

/** Detect the input shape of one parsed row. */
function detect(o: Record<string, unknown>): Found {
  if (Array.isArray(o.responses)) {
    if (o.responses.length < 2) return { error: 'responses needs at least 2 entries' }
    if (!o.responses.every((r) => typeof r === 'string')) return { error: 'responses must all be strings' }
    return { shape: 'responses', responses: o.responses as string[] }
  }
  if ('response_a' in o && 'response_b' in o) {
    if (typeof o.response_a !== 'string' || typeof o.response_b !== 'string') {
      return { error: 'response_a and response_b must be strings' }
    }
    return { shape: 'ab', responses: [o.response_a, o.response_b] }
  }
  if ('chosen' in o && 'rejected' in o) {
    if (typeof o.chosen !== 'string' || typeof o.rejected !== 'string') {
      return { error: 'chosen and rejected must be strings (use the standard, non-conversational shape)' }
    }
    // Review mode: chosen is kept at index 0 so the agreement rate can be computed later.
    return { shape: 'chosen_rejected', responses: [o.chosen, o.rejected] }
  }
  return {
    error: 'unrecognized row: expected responses[], response_a + response_b, or chosen + rejected',
  }
}

/** Parse JSONL text. Never throws; problems are reported with 1-based line numbers. */
export function parseJsonl(text: string): ParseResult {
  const items: Item[] = []
  const errors: ParseError[] = []
  const seen = new Set<string>()
  let shape: Shape | null = null

  const lines = text.replace(/^﻿/, '').split(/\r?\n/)
  lines.forEach((raw, i) => {
    const line = i + 1
    if (raw.trim() === '') return

    let o: unknown
    try {
      o = JSON.parse(raw)
    } catch (e) {
      errors.push({ line, message: 'invalid JSON: ' + (e as Error).message })
      return
    }
    if (typeof o !== 'object' || o === null || Array.isArray(o)) {
      errors.push({ line, message: 'each line must be a JSON object', keys: [] })
      return
    }
    const obj = o as Record<string, unknown>
    const keys = Object.keys(obj)

    if (!isPrompt(obj.prompt)) {
      errors.push({
        line,
        message: 'missing or invalid prompt: expected a string or a non-empty [{role, content}] list',
        keys,
      })
      return
    }
    const found = detect(obj)
    if ('error' in found) {
      errors.push({ line, message: found.error, keys })
      return
    }

    let id = String(obj.id ?? line)
    if (seen.has(id)) id = id + '#' + line // keep ids unique so decisions never collide
    seen.add(id)
    shape ??= found.shape
    items.push({ id, line, prompt: obj.prompt, responses: found.responses, shape: found.shape })
  })

  return { items, errors, shape }
}
