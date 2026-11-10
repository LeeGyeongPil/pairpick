import { isPick } from '../decisions.ts'
import { asMessages, promptText } from '../prompt.ts'
import type { Decision, Item } from '../types.ts'

type Picked = { item: Item; chosen: string; rejected: string; chosenIndex: 0 | 1 }

/** Rows with a pick, in the file's original row order (not decision order). Ties and skips are dropped. */
function pickedRows(items: Item[], decisions: Decision[]): Picked[] {
  const byId = new Map(decisions.map((d) => [d.id, d]))
  const rows: Picked[] = []
  for (const item of items) {
    const d = byId.get(item.id)
    if (!d || !isPick(d.choice)) continue
    const chosen = item.responses[d.choice]
    const rejected = item.responses[d.choice === 0 ? 1 : 0]
    if (chosen === undefined || rejected === undefined) continue
    rows.push({ item, chosen, rejected, chosenIndex: d.choice })
  }
  return rows
}

function toJsonl(lines: unknown[]): string {
  return lines.map((l) => JSON.stringify(l) + '\n').join('')
}

/** TRL standard preference format: {prompt, chosen, rejected} as plain strings. */
export function toTrlStandard(items: Item[], decisions: Decision[]): string {
  return toJsonl(
    pickedRows(items, decisions).map((r) => ({
      prompt: promptText(r.item.prompt),
      chosen: r.chosen,
      rejected: r.rejected,
    })),
  )
}

/** TRL conversational preference format: prompt is a message list, responses are assistant messages. */
export function toTrlConversational(items: Item[], decisions: Decision[]): string {
  return toJsonl(
    pickedRows(items, decisions).map((r) => ({
      prompt: asMessages(r.item.prompt),
      chosen: [{ role: 'assistant', content: r.chosen }],
      rejected: [{ role: 'assistant', content: r.rejected }],
    })),
  )
}

/**
 * TRL KTO unpaired format: {prompt, completion, label}. Each pick gives two lines,
 * the preferred response (label true) and the other one (label false), in original response order.
 */
export function toTrlKto(items: Item[], decisions: Decision[]): string {
  const lines: unknown[] = []
  for (const r of pickedRows(items, decisions)) {
    const prompt = promptText(r.item.prompt)
    const pair: [string, string] = [r.item.responses[0] ?? '', r.item.responses[1] ?? '']
    pair.forEach((completion, index) => lines.push({ prompt, completion, label: index === r.chosenIndex }))
  }
  return toJsonl(lines)
}
