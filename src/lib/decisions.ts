import type { Choice, Decision, Item } from './types.ts'

/** Decisions are kept as a stack in the order they were made, so undo removes the last one. */
export function applyDecision(decisions: Decision[], d: Decision): Decision[] {
  return [...decisions.filter((x) => x.id !== d.id), d]
}

/** Remove the most recent decision. */
export function undoLast(decisions: Decision[]): Decision[] {
  return decisions.slice(0, -1)
}

/** First item that has no decision yet (skipped rows count as decided). */
export function nextUndecided(items: Item[], decisions: Decision[]): Item | undefined {
  const done = new Set(decisions.map((d) => d.id))
  return items.find((it) => !done.has(it.id))
}

export function isPick(c: Choice): c is 0 | 1 {
  return c === 0 || c === 1
}

export type Summary = {
  total: number
  decided: number
  remaining: number
  picked: number
  ties: number
  skipped: number
  /** Share of picks where the left card won; null when nothing was picked. 0.5 is the unbiased value. */
  leftRate: number | null
  /** Review mode: share of picks that agree with the file's original `chosen`; null if not applicable. */
  agreement: { agreed: number; compared: number; rate: number } | null
  /** KTO export size: every pick yields one desirable and one undesirable example. */
  ktoDesirable: number
  ktoUndesirable: number
  /** Rows with 3+ responses: only the first two are compared. */
  extraResponseRows: number
}

export function summarize(items: Item[], decisions: Decision[]): Summary {
  const byId = new Map(items.map((it) => [it.id, it]))
  let picked = 0
  let ties = 0
  let skipped = 0
  let leftWins = 0
  let compared = 0
  let agreed = 0
  for (const d of decisions) {
    const it = byId.get(d.id)
    if (!it) continue
    if (d.choice === 'tie') ties++
    else if (d.choice === 'skip') skipped++
    else {
      picked++
      if (d.choice === d.shownLeft) leftWins++
      if (it.shape === 'chosen_rejected') {
        compared++
        if (d.choice === 0) agreed++
      }
    }
  }
  const decided = picked + ties + skipped
  return {
    total: items.length,
    decided,
    remaining: items.length - decided,
    picked,
    ties,
    skipped,
    leftRate: picked ? leftWins / picked : null,
    agreement: compared ? { agreed, compared, rate: agreed / compared } : null,
    ktoDesirable: picked,
    ktoUndesirable: picked,
    extraResponseRows: items.filter((it) => it.responses.length > 2).length,
  }
}
