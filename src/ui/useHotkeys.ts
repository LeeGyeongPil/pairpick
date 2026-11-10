import { useEffect } from 'react'

export type Key = '1' | '2' | 't' | 's' | 'u'
const KEYS: readonly string[] = ['1', '2', 't', 's', 'u']

/** Call `onKey` for 1/2/t/s/u presses. Ignored while typing in a form field or holding a modifier. */
export function useHotkeys(onKey: (key: Key) => void, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target
      if (t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
      const key = e.key.toLowerCase()
      if (KEYS.includes(key)) onKey(key as Key)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onKey, enabled])
}
