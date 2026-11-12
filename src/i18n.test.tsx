// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import { describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { getLang, LANG_KEY, MESSAGES, resetLang, setLang } from './i18n.ts'
import { downloads } from './test/setup.ts'

type Tree = { [key: string]: unknown }

/** Flatten a dictionary into "path -> value type" so two languages can be compared. */
function shape(o: Tree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'object' && v !== null) Object.assign(out, shape(v as Tree, prefix + k + '.'))
    else out[prefix + k] = typeof v
  }
  return out
}

describe('dictionaries', () => {
  it('have the same keys and value types in both languages', () => {
    expect(shape(MESSAGES.ko)).toEqual(shape(MESSAGES.en))
  })

  it('have no empty text', () => {
    for (const lang of ['en', 'ko'] as const) {
      for (const [key, v] of Object.entries(MESSAGES[lang])) {
        const text = typeof v === 'function' ? (v as (...a: never[]) => string)(...([1, 2, 3] as never[])) : v
        expect(text, lang + '.' + key).not.toBe('')
      }
    }
  })

  it('uses singular and plural in English', () => {
    const en = MESSAGES.en
    expect(en.rowsRead(1)).toBe('1 row read')
    expect(en.rowsRead(2)).toBe('2 rows read')
    expect(en.errorCount(1, false)).toBe('1 line with errors')
    expect(en.errorCount(2, true)).toBe('2 items with errors')
    expect(en.progressImported(1)).toBe('Progress imported: 1 decision')
    expect(en.progressImported(3)).toBe('Progress imported: 3 decisions')
    expect(en.totals(1, 0, 1)).toContain('1 row total')
    expect(en.totals(12, 0, 12)).toContain('12 rows total')
  })
})

describe('first-run language', () => {
  const withBrowserLanguage = (tag: string) => vi.stubGlobal('navigator', { language: tag, languages: [tag] })

  it.each([
    ['ko-KR', 'ko'],
    ['ko', 'ko'],
    ['en-US', 'en'],
    ['fr', 'en'],
  ])('browser language %s gives %s', (tag, expected) => {
    withBrowserLanguage(tag)
    resetLang()
    expect(getLang()).toBe(expected)
    expect(document.documentElement.lang).toBe(expected)
  })

  it('does not save an auto-detected language', () => {
    withBrowserLanguage('ko-KR')
    resetLang()
    expect(localStorage.getItem(LANG_KEY)).toBeNull()
  })

  it('prefers the saved choice over the browser language', () => {
    withBrowserLanguage('ko-KR')
    localStorage.setItem(LANG_KEY, 'en')
    resetLang()
    expect(getLang()).toBe('en')
  })

  it('ignores an invalid saved value', () => {
    withBrowserLanguage('en-US')
    localStorage.setItem(LANG_KEY, 'xx')
    resetLang()
    expect(getLang()).toBe('en')
  })
})

describe('language menu', () => {
  it('switches every visible text, saves the choice and updates <html lang>', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('button', { name: '샘플로 시작' })).toBeTruthy()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Language / 언어' }), 'en')
    expect(screen.getByRole('button', { name: 'Start with sample' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '샘플로 시작' })).toBeNull()
    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem(LANG_KEY)).toBe('en')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Language / 언어' }), 'ko')
    expect(screen.getByRole('button', { name: '샘플로 시작' })).toBeTruthy()
    expect(document.documentElement.lang).toBe('ko')
    expect(localStorage.getItem(LANG_KEY)).toBe('ko')
  })

  it('keeps decisions when the language changes mid-session', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '샘플로 시작' }))
    await screen.findByTestId('counts')
    await user.keyboard('1')
    await user.keyboard('t')
    expect(screen.getByTestId('counts').textContent).toBe('선택 1 · 동점 1 · 건너뛰기 0')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Language / 언어' }), 'en')
    expect(screen.getByTestId('counts').textContent).toBe('Picked 1 · ties 1 · skipped 0')
    expect(screen.getByRole('button', { name: 'Download TRL standard' })).toBeTruthy()
    expect(screen.getByText(/3 \/ 12 · row /)).toBeTruthy()
  })

  it('does not take hotkeys while the language menu has focus', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '샘플로 시작' }))
    await screen.findByTestId('counts')
    screen.getByRole('combobox', { name: 'Language / 언어' }).focus()
    await user.keyboard('t')
    expect(screen.getByTestId('counts').textContent).toBe('선택 0 · 동점 0 · 건너뛰기 0')
  })
})

describe('progress import notice', () => {
  it('follows the language after it was shown (success and error)', async () => {
    vi.stubGlobal('indexedDB', new IDBFactory())
    setLang('ko')
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '샘플로 시작' }))
    await screen.findByTestId('counts')
    await user.keyboard('1')
    downloads.length = 0
    await user.click(screen.getByRole('button', { name: '진행 상황 내려받기' }))
    const text = await downloads[0]!.blob.text()
    const input = document.querySelector('input[type=file]') as HTMLInputElement

    await user.upload(input, new File([text], 'p.json', { type: 'application/json' }))
    expect((await screen.findByRole('alert')).textContent).toBe('진행 상황을 불러왔습니다: 결정 1개')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Language / 언어' }), 'en')
    expect(screen.getByRole('alert').textContent).toBe('Progress imported: 1 decision')

    await user.upload(input, new File(['not json'], 'bad.json', { type: 'application/json' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(MESSAGES.en.progressNotJson))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Language / 언어' }), 'ko')
    expect(screen.getByRole('alert').textContent).toBe(MESSAGES.ko.progressNotJson)
    cleanup()
  })
})

describe('export bytes do not depend on the language', () => {
  async function exportStandard(lang: 'en' | 'ko'): Promise<string[]> {
    vi.stubGlobal('indexedDB', new IDBFactory()) // start each run without saved decisions
    setLang(lang)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: lang === 'en' ? 'Start with sample' : '샘플로 시작' }))
    await screen.findByTestId('counts')
    for (const k of ['1', '2', 't', '1', '2']) await user.keyboard(k)
    downloads.length = 0
    for (const label of lang === 'en' ? ['Download TRL standard', 'Download TRL KTO'] : ['TRL 표준 다운로드', 'TRL KTO 다운로드']) {
      await user.click(screen.getByRole('button', { name: label }))
    }
    await user.click(screen.getByRole('button', { name: lang === 'en' ? 'Download progress' : '진행 상황 내려받기' }))
    const out: string[] = []
    for (const d of downloads) out.push(d.filename + '\n' + (await d.blob.text()))
    cleanup()
    return out
  }

  it('gives the same file names and bytes in English and Korean', async () => {
    const ko = await exportStandard('ko')
    const en = await exportStandard('en')
    expect(ko).toHaveLength(3)
    expect(en).toEqual(ko)
  })
})
