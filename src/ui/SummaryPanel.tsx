import type { Summary } from '../lib/decisions.ts'

const pct = (x: number) => (x * 100).toFixed(0) + '%'

/** Outside this band the left/right split of picks looks like a position habit, not a preference. */
const BIAS_LOW = 0.4
const BIAS_HIGH = 0.6

export function SummaryPanel({ summary: s }: { summary: Summary }) {
  const biased = s.leftRate !== null && s.picked >= 10 && (s.leftRate < BIAS_LOW || s.leftRate > BIAS_HIGH)
  return (
    <section className="summary" aria-label="요약">
      <h2>요약</h2>
      <p data-testid="counts">
        선택 {s.picked} · 동점 {s.ties} · 건너뛰기 {s.skipped}
      </p>
      <p>
        전체 {s.total}행 · 결정 {s.decided} · 남음 {s.remaining}
      </p>
      <p>왼쪽 선택률: {s.leftRate === null ? '-' : pct(s.leftRate)}</p>
      {biased && <p className="banner">왼쪽 선택률이 50%에서 많이 벗어났습니다. 위치 편향이 있는지 확인하세요.</p>}
      {s.agreement && (
        <p>
          원래 라벨과 일치율: {pct(s.agreement.rate)} ({s.agreement.agreed}/{s.agreement.compared})
        </p>
      )}
      <p>
        KTO 예시: 원하는 {s.ktoDesirable} · 원치 않는 {s.ktoUndesirable}
      </p>
      {s.extraResponseRows > 0 && <p>응답이 3개 이상인 행 {s.extraResponseRows}개: 앞의 두 개만 비교합니다.</p>}
    </section>
  )
}
