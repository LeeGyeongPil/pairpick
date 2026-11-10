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
  return (
    <section className="report" aria-label="읽기 결과">
      <h2>읽기 결과</h2>
      <p>
        {fileName}: {result.items.length}행 읽음
        {result.shape ? ' · 입력 모양 ' + SHAPE_NAMES[result.shape] : ''}
        {result.errors.length ? ' · 오류 ' + result.errors.length + '줄' : ''}
      </p>
      {large && <p className="banner">파일이 커서(20MB 또는 2만 행 초과) 화면이 느려질 수 있습니다.</p>}
      {result.errors.length > 0 && (
        <ul className="errors">
          {result.errors.slice(0, 50).map((e) => (
            <li key={e.line}>
              {e.line}번째 줄: {e.message}
              {e.keys ? ' (찾은 키: ' + (e.keys.join(', ') || '없음') + ')' : ''}
            </li>
          ))}
          {result.errors.length > 50 && <li>... 외 {result.errors.length - 50}줄</li>}
        </ul>
      )}
    </section>
  )
}
