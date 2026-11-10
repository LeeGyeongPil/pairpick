import { isPick } from '../decisions.ts'
import type { Decision, Item } from '../types.ts'

export type AlpacaExport = {
  /** JSON array text, ready to save as a file. */
  json: string
  /** Number of rows written. */
  written: number
  /** Picked rows left out because the prompt has several turns (or no user turn). */
  excluded: number
}

/** The instruction text of a prompt, or null when it cannot be expressed as one alpaca instruction. */
function instructionOf(item: Item): string | null {
  const p = item.prompt
  if (typeof p === 'string') return p
  const only = p[0]
  return p.length === 1 && only && only.role === 'user' ? only.content : null
}

/** LLaMA-Factory alpaca preference format, JSON array of {instruction, input, chosen, rejected}. */
export function toAlpaca(items: Item[], decisions: Decision[]): AlpacaExport {
  const byId = new Map(decisions.map((d) => [d.id, d]))
  const rows: { instruction: string; input: string; chosen: string; rejected: string }[] = []
  let excluded = 0
  for (const item of items) {
    const d = byId.get(item.id)
    if (!d || !isPick(d.choice)) continue
    const chosen = item.responses[d.choice]
    const rejected = item.responses[d.choice === 0 ? 1 : 0]
    if (chosen === undefined || rejected === undefined) continue
    const instruction = instructionOf(item)
    if (instruction === null) {
      excluded++
      continue
    }
    rows.push({ instruction, input: '', chosen, rejected })
  }
  return { json: JSON.stringify(rows, null, 2) + '\n', written: rows.length, excluded }
}

/** The dataset_info.json entry to paste into LLaMA-Factory's data/dataset_info.json. */
export function toDatasetInfo(datasetName: string, fileName: string): string {
  const info = {
    [datasetName]: {
      file_name: fileName,
      ranking: true,
      columns: { prompt: 'instruction', query: 'input', chosen: 'chosen', rejected: 'rejected' },
    },
  }
  return JSON.stringify(info, null, 2) + '\n'
}
