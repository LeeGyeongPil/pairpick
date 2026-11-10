import type { Decision } from './types.ts'

export type ProgressFile = { version: 1; fingerprint: string; decisions: Decision[] }

export function serializeProgress(fingerprint: string, decisions: Decision[]): string {
  const file: ProgressFile = { version: 1, fingerprint, decisions }
  return JSON.stringify(file, null, 2) + '\n'
}

export type ProgressResult = { ok: true; decisions: Decision[] } | { ok: false; error: string }

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
    return { ok: false, error: '진행 파일을 읽을 수 없습니다: JSON 형식이 아닙니다.' }
  }
  const f = o as Partial<ProgressFile> | null
  if (!f || f.version !== 1 || typeof f.fingerprint !== 'string' || !Array.isArray(f.decisions)) {
    return { ok: false, error: '진행 파일 형식이 맞지 않습니다. pairpick이 내려받은 파일인지 확인하세요.' }
  }
  if (f.fingerprint !== expectedFingerprint) {
    return {
      ok: false,
      error: '이 진행 파일은 다른 입력 파일의 것입니다(지문 불일치). 같은 JSONL 파일을 연 상태에서 불러오세요.',
    }
  }
  if (!f.decisions.every(validDecision)) {
    return { ok: false, error: '진행 파일의 결정 목록에 잘못된 항목이 있습니다.' }
  }
  return { ok: true, decisions: f.decisions }
}
