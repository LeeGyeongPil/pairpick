import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { applyDecision, nextUndecided, summarize, undoLast } from './lib/decisions.ts'
import { LANGS, setLang, type Lang } from './i18n.ts'
import { fingerprint } from './lib/hash.ts'
import { shownLeft } from './lib/order.ts'
import { parseJsonl } from './lib/parse.ts'
import { qualityWarnings } from './lib/quality.ts'
import { openStore, type Store } from './lib/store.ts'
import type { Choice, Decision, ParseResult } from './lib/types.ts'
import sampleText from './sample/sample.jsonl?raw'
import { CompareView } from './ui/CompareView.tsx'
import { DropZone } from './ui/DropZone.tsx'
import { ExportPanel } from './ui/ExportPanel.tsx'
import { ParseReport } from './ui/ParseReport.tsx'
import { StorageBanner } from './ui/StorageBanner.tsx'
import { SummaryPanel } from './ui/SummaryPanel.tsx'
import { useHotkeys, type Key } from './ui/useHotkeys.ts'
import { useLang, useT } from './ui/useLang.ts'

type Session = {
  fileName: string
  bytes: number
  fingerprint: string
  result: ParseResult
  decisions: Decision[]
}

const KEY_TO_CHOICE: Record<Exclude<Key, 'u'>, 'left' | 'right' | 'tie' | 'skip'> = {
  '1': 'left',
  '2': 'right',
  t: 'tie',
  s: 'skip',
}

const LANG_NAMES: Record<Lang, string> = { en: 'English', ko: '한국어' } // each language keeps its own name

export default function App() {
  const lang = useLang()
  const m = useT()
  const [session, setSession] = useState<Session | null>(null)
  const [storageOk, setStorageOk] = useState(true)
  const storeRef = useRef<Promise<Store | null> | null>(null)

  // Open IndexedDB once. null means unavailable: keep working in memory and show a banner.
  const getStore = useCallback((): Promise<Store | null> => {
    storeRef.current ??= openStore(typeof indexedDB === 'undefined' ? undefined : indexedDB)
    return storeRef.current
  }, [])

  useEffect(() => {
    let alive = true
    void getStore().then((s) => {
      if (alive && s === null) setStorageOk(false)
    })
    return () => {
      alive = false
      const pending = storeRef.current
      storeRef.current = null
      void pending?.then((s) => s?.close())
    }
  }, [getStore])

  const persist = useCallback(
    (fp: string, decisions: Decision[]) => {
      void getStore().then((s) => s?.save(fp, decisions, Date.now()).catch(() => setStorageOk(false)))
    },
    [getStore],
  )

  const load = async (text: string, fileName: string) => {
    const fp = fingerprint(text)
    const result = parseJsonl(text)
    const store = await getStore()
    // Restore earlier decisions for the same file, ignoring ids that no longer exist.
    const saved = store ? await store.load(fp).catch(() => []) : []
    const ids = new Set(result.items.map((i) => i.id))
    setSession({
      fileName,
      bytes: new TextEncoder().encode(text).length,
      fingerprint: fp,
      result,
      decisions: saved.filter((d) => ids.has(d.id)),
    })
  }

  const items = session?.result.items
  const decisions = session?.decisions
  const current = useMemo(() => (items && decisions ? nextUndecided(items, decisions) : undefined), [items, decisions])

  const update = useCallback(
    (next: Decision[]) => {
      setSession((s) => (s ? { ...s, decisions: next } : s))
      if (session) persist(session.fingerprint, next)
    },
    [persist, session],
  )

  const onKey = useCallback(
    (key: Key) => {
      if (!session) return
      if (key === 'u') return update(undoLast(session.decisions))
      if (!current) return
      const left = shownLeft(session.fingerprint, current.id)
      const which = KEY_TO_CHOICE[key]
      const choice: Choice = which === 'left' ? left : which === 'right' ? (left === 0 ? 1 : 0) : which
      update(applyDecision(session.decisions, { id: current.id, choice, shownLeft: left }))
    },
    [session, current, update],
  )
  useHotkeys(onKey, session !== null && session.result.items.length > 0)

  const warnings = useMemo(() => (items ? qualityWarnings(items) : new Map()), [items])

  return (
    <main>
      <header className="top">
        <h1>pairpick</h1>
        <select className="lang" aria-label={m.languageLabel} value={lang} onChange={(e) => setLang(e.target.value as Lang, true)}>
          {LANGS.map((l) => (
            <option key={l} value={l}>
              {LANG_NAMES[l]}
            </option>
          ))}
        </select>
      </header>
      <p className="tagline">{m.tagline}</p>
      {!storageOk && <StorageBanner />}
      {!session && <DropZone onText={load} onSample={() => void load(sampleText, 'sample.jsonl')} />}
      {session && (
        <>
          <ParseReport fileName={session.fileName} bytes={session.bytes} result={session.result} />
          <button type="button" onClick={() => setSession(null)}>
            {m.openAnother}
          </button>
          {session.result.items.length > 0 && (
            <>
              {current ? (
                <CompareView
                  item={current}
                  index={session.decisions.length}
                  total={session.result.items.length}
                  left={shownLeft(session.fingerprint, current.id)}
                  warnings={warnings.get(current.id) ?? []}
                />
              ) : (
                <p className="done">{m.done}</p>
              )}
              <SummaryPanel summary={summarize(session.result.items, session.decisions)} />
              <ExportPanel
                items={session.result.items}
                decisions={session.decisions}
                fingerprint={session.fingerprint}
                baseName={session.fileName.replace(/\.[^.]*$/, '')}
                onImport={update}
              />
            </>
          )}
        </>
      )}
    </main>
  )
}
