import type { Decision } from './types.ts'

const DB_NAME = 'pairpick'
const STORE = 'progress'

export type Store = {
  load(fingerprint: string): Promise<Decision[]>
  save(fingerprint: string, decisions: Decision[], savedAt: number): Promise<void>
  close(): void
}

type Row = { fingerprint: string; decisions: Decision[]; savedAt: number }

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/**
 * Open the IndexedDB store. Returns null when IndexedDB is missing or cannot be opened
 * (private mode, blocked storage), so callers can fall back to memory plus a banner.
 * `savedAt` is passed in by the caller so this module never reads the clock.
 */
export async function openStore(factory: IDBFactory | undefined): Promise<Store | null> {
  if (!factory) return null
  let db: IDBDatabase
  try {
    const open = factory.open(DB_NAME, 1)
    open.onupgradeneeded = () => {
      open.result.createObjectStore(STORE, { keyPath: 'fingerprint' })
    }
    db = await request(open)
  } catch {
    return null
  }
  return {
    async load(fingerprint) {
      const row = (await request(db.transaction(STORE).objectStore(STORE).get(fingerprint))) as Row | undefined
      return row?.decisions ?? []
    },
    async save(fingerprint, decisions, savedAt) {
      const tx = db.transaction(STORE, 'readwrite')
      const done = new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
      })
      tx.objectStore(STORE).put({ fingerprint, decisions, savedAt } satisfies Row)
      await done
    },
    close() {
      db.close()
    },
  }
}
