import { warningLabel, type Warning } from '../lib/quality.ts'
import type { Item, Prompt } from '../lib/types.ts'

type Props = {
  item: Item
  index: number
  total: number
  left: 0 | 1
  warnings: Warning[]
}

function PromptView({ prompt }: { prompt: Prompt }) {
  if (typeof prompt === 'string') return <p className="prompt-text">{prompt}</p>
  return (
    <div className="prompt-text">
      {prompt.map((m, i) => (
        <p key={i}>
          <strong>{m.role}</strong>: {m.content}
        </p>
      ))}
    </div>
  )
}

export function CompareView({ item, index, total, left, warnings }: Props) {
  const right = left === 0 ? 1 : 0
  return (
    <section className="compare" aria-label="비교">
      <progress max={total} value={index} aria-label="진행 막대" />
      <p className="counter">
        {index + 1} / {total} · 행 {item.id}
      </p>
      <div className="badges">
        {warnings.map((w) => (
          <span className="badge" key={w.kind}>
            {warningLabel(w)}
          </span>
        ))}
      </div>
      <div className="prompt">
        <h2>프롬프트</h2>
        <PromptView prompt={item.prompt} />
      </div>
      <div className="cards">
        <article className="card" aria-label="왼쪽 응답">
          <h3>왼쪽 (1)</h3>
          <pre>{item.responses[left]}</pre>
        </article>
        <article className="card" aria-label="오른쪽 응답">
          <h3>오른쪽 (2)</h3>
          <pre>{item.responses[right]}</pre>
        </article>
      </div>
      <p className="keys">
        <kbd>1</kbd> 왼쪽이 낫다 · <kbd>2</kbd> 오른쪽이 낫다 · <kbd>t</kbd> 동점 · <kbd>s</kbd> 건너뛰기 · <kbd>u</kbd> 되돌리기
      </p>
    </section>
  )
}
