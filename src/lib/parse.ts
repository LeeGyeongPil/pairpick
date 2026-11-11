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

type Ctx = { items: Item[]; errors: ParseError[]; seen: Set<string>; shape: Shape | null }

/** Validate one parsed row and add it to the result. Shared by the JSONL and JSON-array paths. */
function addRow(ctx: Ctx, o: unknown, n: number, notObjectMessage: string): void {
  if (typeof o !== 'object' || o === null || Array.isArray(o)) {
    ctx.errors.push({ line: n, message: notObjectMessage, keys: [] })
    return
  }
  const obj = o as Record<string, unknown>
  const keys = Object.keys(obj)

  if (!isPrompt(obj.prompt)) {
    ctx.errors.push({
      line: n,
      message: 'missing or invalid prompt: expected a string or a non-empty [{role, content}] list',
      keys,
    })
    return
  }
  const found = detect(obj)
  if ('error' in found) {
    ctx.errors.push({ line: n, message: found.error, keys })
    return
  }

  let id = String(obj.id ?? n)
  if (ctx.seen.has(id)) id = id + '#' + n // keep ids unique so decisions never collide
  ctx.seen.add(id)
  ctx.shape ??= found.shape
  ctx.items.push({ id, line: n, prompt: obj.prompt, responses: found.responses, shape: found.shape })
}

/**
 * Parse JSONL text, or a JSON array of row objects (detected by content, not file name).
 * Never throws; problems are reported with 1-based line (JSONL) or item (array) numbers.
 */
export function parseJsonl(text: string): ParseResult {
  const ctx: Ctx = { items: [], errors: [], seen: new Set(), shape: null }
  const body = text.replace(/^\uFEFF/, '')

  // JSON array mode: first non-blank char is '[' and the whole text parses to an array.
  if (body.trimStart().startsWith('[')) {
    let whole: unknown
    try {
      whole = JSON.parse(body)
    } catch {
      whole = undefined // not a valid array: fall back to the JSONL path below
    }
    if (Array.isArray(whole)) {
      whole.forEach((o, i) => addRow(ctx, o, i + 1, 'each array item must be a JSON object'))
      return { items: ctx.items, errors: ctx.errors, shape: ctx.shape, format: 'json-array' }
    }
  }

  const lines = body.split(/\r?\n/)

  // An indented single JSON object would otherwise produce one error per line.
  if (lines.filter((l) => l.trim() !== '').length >= 2) {
    try {
      const whole: unknown = JSON.parse(body)
      if (typeof whole === 'object' && whole !== null && !Array.isArray(whole)) {
        return {
          items: [],
          errors: [
            {
              line: 1,
              message:
                'the file is a single JSON object; expected JSONL (one object per line) or a JSON array of row objects',
              keys: Object.keys(whole),
            },
          ],
          shape: null,
        }
      }
    } catch {
      // not one JSON value: treat as JSONL
    }
  }

  lines.forEach((raw, i) => {
    if (raw.trim() === '') return
    let o: unknown
    try {
      o = JSON.parse(raw)
    } catch (e) {
      ctx.errors.push({ line: i + 1, message: 'invalid JSON: ' + (e as Error).message })
      return
    }
    addRow(ctx, o, i + 1, 'each line must be a JSON object')
  })

  return { items: ctx.items, errors: ctx.errors, shape: ctx.shape }
}
