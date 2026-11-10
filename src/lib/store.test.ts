import { IDBFactory } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
import { parseProgress, serializeProgress } from './progress.ts'
import { openStore } from './store.ts'
import type { Decision } from './types.ts'

const decisions: Decision[] = [
  { id: 'a', choice: 0, shownLeft: 1 },
  { id: 'b', choice: 'tie', shownLeft: 0 },
]

describe('store', () => {
  it('saves and restores decisions per fingerprint, also after reopening', async () => {
    const factory = new IDBFactory()
    const first = await openStore(factory)
    expect(first).not.toBeNull()
    await first!.save('fp1', decisions, 1)
    first!.close()

    const second = await openStore(factory)
    expect(await second!.load('fp1')).toEqual(decisions)
    expect(await second!.load('other')).toEqual([])
    second!.close()
  })

  it('overwrites the earlier save for the same fingerprint', async () => {
    const store = await openStore(new IDBFactory())
    await store!.save('fp', decisions, 1)
    await store!.save('fp', decisions.slice(0, 1), 2)
    expect(await store!.load('fp')).toEqual(decisions.slice(0, 1))
    store!.close()
  })

  it('returns null when IndexedDB is missing', async () => {
    expect(await openStore(undefined)).toBeNull()
  })

  it('returns null when opening fails', async () => {
    const broken = {
      open() {
        const req = {} as Partial<IDBOpenDBRequest> & { onerror: ((e: Event) => void) | null }
        queueMicrotask(() => req.onerror?.(new Event("error")))
        return req as IDBOpenDBRequest
      },
    } as unknown as IDBFactory
    expect(await openStore(broken)).toBeNull()
  })
})

describe('progress file', () => {
  it('round-trips decisions', () => {
    const text = serializeProgress('fp', decisions)
    expect(parseProgress(text, 'fp')).toEqual({ ok: true, decisions })
  })

  it('rejects another fingerprint, bad JSON, wrong shape and bad entries', () => {
    const text = serializeProgress('fp', decisions)
    const r = parseProgress(text, 'different')
    expect(r.ok).toBe(false)
    expect(!r.ok && r.error).toMatch(/지문 불일치/)
    expect(parseProgress('not json', 'fp').ok).toBe(false)
    expect(parseProgress('{"version":2}', 'fp').ok).toBe(false)
    expect(parseProgress('null', 'fp').ok).toBe(false)
    const bad = JSON.stringify({ version: 1, fingerprint: 'fp', decisions: [{ id: 'a', choice: 5, shownLeft: 0 }] })
    expect(parseProgress(bad, 'fp').ok).toBe(false)
  })
})
