import type { Item } from './types.ts'

export type Warning =
  | { kind: 'identical' }
  | { kind: 'empty' }
  | { kind: 'length'; ratio: number }
  | { kind: 'duplicatePrompt'; count: number }

/** Length ratio (longer / shorter) at which a warning appears. */
export const LENGTH_RATIO_LIMIT = 3

/** Quality warnings per row id. Rows without warnings are absent from the map. */
export function qualityWarnings(items: Item[]): Map<string, Warning[]> {
  const promptCount = new Map<string, number>()
  for (const it of items) {
    const key = JSON.stringify(it.prompt)
    promptCount.set(key, (promptCount.get(key) ?? 0) + 1)
  }

  const result = new Map<string, Warning[]>()
  for (const it of items) {
    const [a = '', b = ''] = it.responses
    const warnings: Warning[] = []
    if (a === b) warnings.push({ kind: 'identical' })
    const la = a.trim().length
    const lb = b.trim().length
    if (la === 0 || lb === 0) warnings.push({ kind: 'empty' })
    else {
      const ratio = Math.max(la, lb) / Math.min(la, lb)
      if (ratio >= LENGTH_RATIO_LIMIT) warnings.push({ kind: 'length', ratio })
    }
    const count = promptCount.get(JSON.stringify(it.prompt)) ?? 1
    if (count > 1) warnings.push({ kind: 'duplicatePrompt', count })
    if (warnings.length) result.set(it.id, warnings)
  }
  return result
}

/** Short Korean badge text for the UI. */
export function warningLabel(w: Warning): string {
  switch (w.kind) {
    case 'identical':
      return '두 응답이 같음'
    case 'empty':
      return '빈 응답'
    case 'length':
      return '길이 ' + w.ratio.toFixed(1) + '배 차이'
    case 'duplicatePrompt':
      return '같은 프롬프트가 ' + w.count + '번 나옴'
  }
}
