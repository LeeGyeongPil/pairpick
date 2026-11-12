// Shared test setup: a fresh in-memory IndexedDB per test, and download interception for jsdom tests.
import { IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, vi } from 'vitest'
import { setLang } from '../i18n.ts'

/** Blobs passed to URL.createObjectURL, with the file name of the click that used them. */
export const downloads: { filename: string; blob: Blob }[] = []

beforeEach(() => {
  vi.stubGlobal('indexedDB', new IDBFactory())
  // The existing tests compare Korean text, so pin the language (no persistence).
  try {
    localStorage.clear()
  } catch {
    // node environment: no localStorage
  }
  setLang('ko')
  downloads.length = 0
  if (typeof document === 'undefined') return
  const blobs: Blob[] = []
  URL.createObjectURL = (obj: Blob | MediaSource) => {
    blobs.push(obj as Blob)
    return 'blob:pairpick-test-' + (blobs.length - 1)
  }
  URL.revokeObjectURL = () => {}
  // jsdom cannot navigate to a download link; record it instead.
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    const index = Number(this.href.split('pairpick-test-')[1])
    const blob = blobs[index]
    if (blob) downloads.push({ filename: this.download, blob })
  }
})

afterEach(async () => {
  vi.unstubAllGlobals()
  if (typeof document !== 'undefined') {
    const { cleanup } = await import('@testing-library/react')
    cleanup()
  }
})
