import type { Decision } from './types.ts'

export type ProgressFile = { version: 1; fingerprint: string; decisions: Decision[] }

export function serializeProgress(fingerprint: string, decisions: Decision[]): string {
  const file: ProgressFile = { version: 1, fingerprint, decisions }
  return JSON.stringify(file, null, 2) + '\n'
}

/** Message key of the failure; the UI translates it with the language active at render time. */
export type ProgressErrorKey = 'progressNotJson' | 'progressBadFormat' | 'progressOtherFile' | 'progressBadDecisions'

export type ProgressResult = { ok: true; decisions: Decision[] } | { ok: false; error: ProgressErrorKey }

function validDecision(d: unknown): d is Decision {
  if (typeof d !== 'object' || d === null) return false
  const x = d as Record<string, unknown>
  return (
    typeof x.id === 'string' &&
    (x.choice === 0 || x.choice === 1 || x.choice === 'tie' || x.choice === 'skip') &&
    (x.shownLeft === 0 || x.shownLeft === 1)
  )
}

/** Parse a progress file and check it belongs to the currently loaded file. */
export function parseProgress(text: string, expectedFingerprint: string): ProgressResult {
  let o: unknown
  try {
    o = JSON.parse(text)
  } catch {
    return { ok: false, error: 'progressNotJson' }
  }
  const f = o as Partial<ProgressFile> | null
  if (!f || f.version !== 1 || typeof f.fingerprint !== 'string' || !Array.isArray(f.decisions)) {
    return { ok: false, error: 'progressBadFormat' }
  }
  if (f.fingerprint !== expectedFingerprint) {
    return { ok: false, error: 'progressOtherFile' }
  }
  if (!f.decisions.every(validDecision)) {
    return { ok: false, error: 'progressBadDecisions' }
  }
  return { ok: true, decisions: f.decisions }
}
