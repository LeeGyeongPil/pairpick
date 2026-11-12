import type { ParseResult, Shape } from '../lib/types.ts'
import type { Messages } from '../i18n.ts'
import { useT } from './useLang.ts'

// Shape names are input field names, so they stay the same in both languages; only the note is translated.
function shapeName(shape: Shape, m: Messages): string {
  if (shape === 'responses') return 'prompt + responses[]'
  if (shape === 'ab') return 'prompt + response_a / response_b'
  return 'prompt + chosen / rejected' + m.shapeChosenRejected
}

/** Warn above this size: M1 parses on the main thread. */
export const LARGE_FILE_BYTES = 20 * 1024 * 1024
export const LARGE_FILE_ROWS = 20000

type Props = { fileName: string; bytes: number; result: ParseResult }

export function ParseReport({ fileName, bytes, result }: Props) {
  const m = useT()
  const large = bytes > LARGE_FILE_BYTES || result.items.length > LARGE_FILE_ROWS
  const arr = result.format === 'json-array'
  const empty =
    result.items.length === 0 && result.errors.length === 0
      ? (arr ? m.emptyArray : m.emptyFile) + ' ' + m.parseHint
      : ''
  return (
    <section className="report" aria-label={m.reportTitle}>
      <h2>{m.reportTitle}</h2>
      <p>
        {fileName}: {m.rowsRead(result.items.length)}
        {result.shape ? ' · ' + m.inputShape(shapeName(result.shape, m)) + (arr ? ' · ' + m.jsonArray : '') : arr ? ' · ' + m.jsonArray : ''}
        {result.errors.length ? ' · ' + m.errorCount(result.errors.length, arr) : ''}
      </p>
      {empty && <p className="banner">{empty}</p>}
      {large && <p className="banner">{m.largeFile}</p>}
      {result.errors.length > 0 && (
        <ul className="errors">
          {result.errors.slice(0, 50).map((e) => (
            <li key={e.line}>
              {m.errorAt(e.line, arr)}: {e.message}
              {e.keys ? m.foundKeys(e.keys.join(', ') || m.noKeys) : ''}
            </li>
          ))}
          {result.errors.length > 50 && <li>{m.moreErrors(result.errors.length - 50, arr)}</li>}
        </ul>
      )}
    </section>
  )
}
