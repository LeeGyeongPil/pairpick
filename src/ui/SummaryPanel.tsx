import type { Summary } from '../lib/decisions.ts'
import { useT } from './useLang.ts'

const pct = (x: number) => (x * 100).toFixed(0) + '%'

/** Outside this band the left/right split of picks looks like a position habit, not a preference. */
const BIAS_LOW = 0.4
const BIAS_HIGH = 0.6

export function SummaryPanel({ summary: s }: { summary: Summary }) {
  const m = useT()
  const biased = s.leftRate !== null && s.picked >= 10 && (s.leftRate < BIAS_LOW || s.leftRate > BIAS_HIGH)
  return (
    <section className="summary" aria-label={m.summaryTitle}>
      <h2>{m.summaryTitle}</h2>
      <p data-testid="counts">{m.counts(s.picked, s.ties, s.skipped)}</p>
      <p>{m.totals(s.total, s.decided, s.remaining)}</p>
      <p>{m.leftRate(s.leftRate === null ? '-' : pct(s.leftRate))}</p>
      {biased && <p className="banner">{m.biasWarning}</p>}
      {s.agreement && <p>{m.agreement(pct(s.agreement.rate), s.agreement.agreed, s.agreement.compared)}</p>}
      <p>{m.kto(s.ktoDesirable, s.ktoUndesirable)}</p>
      {s.extraResponseRows > 0 && <p>{m.extraResponses(s.extraResponseRows)}</p>}
    </section>
  )
}
