import { useState } from 'react'
import { downloadText } from '../lib/download.ts'
import { toAlpaca, toDatasetInfo } from '../lib/export/llamafactory.ts'
import { toTrlConversational, toTrlKto, toTrlStandard } from '../lib/export/trl.ts'
import { parseProgress, serializeProgress, type ProgressErrorKey } from '../lib/progress.ts'
import type { Decision, Item } from '../lib/types.ts'
import { useT } from './useLang.ts'

type Props = {
  items: Item[]
  decisions: Decision[]
  fingerprint: string
  /** Input file name without its extension, used to name downloads. */
  baseName: string
  onImport: (decisions: Decision[]) => void
}

type Format = 'standard' | 'conversational' | 'kto' | 'alpaca'

export function ExportPanel({ items, decisions, fingerprint, baseName, onImport }: Props) {
  const m = useT()
  const LABELS: Record<Format, string> = {
    standard: m.labelStandard,
    conversational: m.labelConversational,
    kto: m.labelKto,
    alpaca: m.labelAlpaca,
  }
  const [format, setFormat] = useState<Format>('standard')
  // Keep a code (not translated text) so the notice follows later language changes.
  const [notice, setNotice] = useState<{ key: ProgressErrorKey } | { key: 'progressImported'; count: number } | null>(null)

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
      setNotice({ key: 'progressImported', count: result.decisions.length })
    } else setNotice({ key: result.error })
  }

  return (
    <section className="export" aria-label={m.exportTitle}>
      <h2>{m.exportTitle}</h2>
      <p>{m.exportHint}</p>
      <div className="buttons">
        {(Object.keys(LABELS) as Format[]).map((f) => (
          <button key={f} type="button" onClick={() => download(f)}>
            {m.download(LABELS[f])}
          </button>
        ))}
      </div>
      <label>
        {m.previewFormat}{' '}
        <select value={format} onChange={(e) => setFormat(e.target.value as Format)} aria-label={m.previewFormat}>
          {(Object.keys(LABELS) as Format[]).map((f) => (
            <option key={f} value={f}>
              {LABELS[f]}
            </option>
          ))}
        </select>
      </label>
      {alpaca.excluded > 0 && format === 'alpaca' && (
        <p className="hint">{m.alpacaExcluded(alpaca.excluded)}</p>
      )}
      <pre className="preview">{preview || m.previewEmpty}</pre>

      <h3>{m.progressBackup}</h3>
      <div className="buttons">
        <button type="button" onClick={() => downloadText(baseName + '.progress.json', serializeProgress(fingerprint, decisions), 'application/json')}>
          {m.progressDownload}
        </button>
        <label className="button">
          {m.progressImport}
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
      {notice && <p role="alert">{notice.key === 'progressImported' ? m.progressImported(notice.count) : m[notice.key]}</p>}
    </section>
  )
}
