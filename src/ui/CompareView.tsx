import { warningLabel, type Warning } from '../lib/quality.ts'
import type { Item, Prompt } from '../lib/types.ts'
import { useT } from './useLang.ts'

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
  const m = useT()
  const right = left === 0 ? 1 : 0
  return (
    <section className="compare" aria-label={m.compareLabel}>
      <progress max={total} value={index} aria-label={m.progressBar} />
      <p className="counter">{m.counter(index + 1, total, item.id)}</p>
      <div className="badges">
        {warnings.map((w) => (
          <span className="badge" key={w.kind}>
            {warningLabel(w)}
          </span>
        ))}
      </div>
      <div className="prompt">
        <h2>{m.promptTitle}</h2>
        <PromptView prompt={item.prompt} />
      </div>
      <div className="cards">
        <article className="card" aria-label={m.leftResponse}>
          <h3>{m.leftTitle}</h3>
          <pre>{item.responses[left]}</pre>
        </article>
        <article className="card" aria-label={m.rightResponse}>
          <h3>{m.rightTitle}</h3>
          <pre>{item.responses[right]}</pre>
        </article>
      </div>
      <p className="keys">
        <kbd>1</kbd> {m.keyLeft} · <kbd>2</kbd> {m.keyRight} · <kbd>t</kbd> {m.keyTie} · <kbd>s</kbd> {m.keySkip} · <kbd>u</kbd>{' '}
        {m.keyUndo}
      </p>
    </section>
  )
}
