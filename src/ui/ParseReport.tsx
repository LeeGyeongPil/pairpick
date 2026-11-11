import type { ParseResult, Shape } from '../lib/types.ts'

const SHAPE_NAMES: Record<Shape, string> = {
  responses: 'prompt + responses[]',
  ab: 'prompt + response_a / response_b',
  chosen_rejected: 'prompt + chosen / rejected (재검토 모드: 원래 라벨은 숨김)',
}

/** Warn above this size: M1 parses on the main thread. */
export const LARGE_FILE_BYTES = 20 * 1024 * 1024
export const LARGE_FILE_ROWS = 20000

type Props = { fileName: string; bytes: number; result: ParseResult }

export function ParseReport({ fileName, bytes, result }: Props) {
  const large = bytes > LARGE_FILE_BYTES || result.items.length > LARGE_FILE_ROWS
  const arr = result.format === 'json-array'
  const unit = arr ? '항목' : '줄'
  const FORMAT_HINT = '한 줄에 JSON 객체 하나(JSONL) 또는 객체 배열(JSON) 파일을 넣어 주세요.'
  const empty =
    result.items.length === 0 && result.errors.length === 0
      ? arr
        ? '배열이 비어 있어 읽을 행이 없습니다. ' + FORMAT_HINT
        : '읽을 행이 없습니다. 빈 파일이거나 공백만 있습니다. ' + FORMAT_HINT
      : ''
  return (
    <section className="report" aria-label="읽기 결과">
      <h2>읽기 결과</h2>
      <p>
        {fileName}: {result.items.length}행 읽음
        {result.shape ? ' · 입력 모양 ' + SHAPE_NAMES[result.shape] + (arr ? ' · JSON 배열' : '') : arr ? ' · JSON 배열' : ''}
        {result.errors.length ? ' · 오류 ' + result.errors.length + unit : ''}
      </p>
      {empty && <p className="banner">{empty}</p>}
      {large && <p className="banner">파일이 커서(20MB 또는 2만 행 초과) 화면이 느려질 수 있습니다.</p>}
      {result.errors.length > 0 && (
        <ul className="errors">
          {result.errors.slice(0, 50).map((e) => (
            <li key={e.line}>
              {e.line}번째 {unit}: {e.message}
              {e.keys ? ' (찾은 키: ' + (e.keys.join(', ') || '없음') + ')' : ''}
            </li>
          ))}
          {result.errors.length > 50 && <li>... 외 {result.errors.length - 50}{unit}</li>}
        </ul>
      )}
    </section>
  )
}
