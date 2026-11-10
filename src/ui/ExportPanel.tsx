import { useState } from 'react'
import { downloadText } from '../lib/download.ts'
import { toAlpaca, toDatasetInfo } from '../lib/export/llamafactory.ts'
import { toTrlConversational, toTrlKto, toTrlStandard } from '../lib/export/trl.ts'
import { parseProgress, serializeProgress } from '../lib/progress.ts'
import type { Decision, Item } from '../lib/types.ts'

type Props = {
  items: Item[]
  decisions: Decision[]
  fingerprint: string
  /** Input file name without its extension, used to name downloads. */
  baseName: string
  onImport: (decisions: Decision[]) => void
}

type Format = 'standard' | 'conversational' | 'kto' | 'alpaca'

const LABELS: Record<Format, string> = {
  standard: 'TRL 표준',
  conversational: 'TRL 대화형',
  kto: 'TRL KTO',
  alpaca: 'LLaMA-Factory alpaca',
}

export function ExportPanel({ items, decisions, fingerprint, baseName, onImport }: Props) {
  const [format, setFormat] = useState<Format>('standard')
  const [message, setMessage] = useState('')

  const alpaca = toAlpaca(items, decisions)
  const text: Record<Format, string> = {
    standard: toTrlStandard(items, decisions),
    conversational: toTrlConversational(items, decisions),
    kto: toTrlKto(items, decisions),
    alpaca: alpaca.json,
  }
  const names: Record<Format, string> = {
    standard: baseName + '.trl-pref.jsonl',
    conversational: baseName + '.trl-pref-conv.jsonl',
    kto: baseName + '.trl-kto.jsonl',
    alpaca: baseName + '.llamafactory-alpaca.json',
  }

  const download = (f: Format) => {
    downloadText(names[f], text[f], 'application/json')
    if (f === 'alpaca') {
      // LLaMA-Factory also needs the dataset_info.json entry that points at the file.
      downloadText('dataset_info.json', toDatasetInfo(baseName + '_preference', names.alpaca), 'application/json')
    }
  }

  const preview = text[format].split('\n').slice(0, format === 'alpaca' ? 14 : 3).join('\n')

  const importProgress = async (file: File) => {
    const result = parseProgress(await file.text(), fingerprint)
    if (result.ok) {
      onImport(result.decisions)
      setMessage('진행 상황을 불러왔습니다: 결정 ' + result.decisions.length + '개')
    } else setMessage(result.error)
  }

  return (
    <section className="export" aria-label="내보내기">
      <h2>내보내기</h2>
      <p>동점·건너뛰기는 제외하고, 원본 행 순서로 씁니다.</p>
      <div className="buttons">
        {(Object.keys(LABELS) as Format[]).map((f) => (
          <button key={f} type="button" onClick={() => download(f)}>
            {LABELS[f]} 다운로드
          </button>
        ))}
      </div>
      <label>
        미리보기 형식{' '}
        <select value={format} onChange={(e) => setFormat(e.target.value as Format)} aria-label="미리보기 형식">
          {(Object.keys(LABELS) as Format[]).map((f) => (
            <option key={f} value={f}>
              {LABELS[f]}
            </option>
          ))}
        </select>
      </label>
      {alpaca.excluded > 0 && format === 'alpaca' && (
        <p className="hint">여러 턴 프롬프트 {alpaca.excluded}행은 alpaca 형식에서 제외됩니다.</p>
      )}
      <pre className="preview">{preview || '(아직 내보낼 선택이 없습니다)'}</pre>

      <h3>진행 상황 백업</h3>
      <div className="buttons">
        <button type="button" onClick={() => downloadText(baseName + '.progress.json', serializeProgress(fingerprint, decisions), 'application/json')}>
          진행 상황 내려받기
        </button>
        <label className="button">
          진행 상황 불러오기
          <input
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importProgress(file)
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {message && <p role="alert">{message}</p>}
    </section>
  )
}
