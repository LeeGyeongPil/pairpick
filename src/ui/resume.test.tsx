// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { fingerprint } from '../lib/hash.ts'
import { serializeProgress } from '../lib/progress.ts'
import sample from '../sample/sample.jsonl?raw'
import { downloads } from '../test/setup.ts'

const start = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: '샘플로 시작' }))
  await screen.findByTestId('counts')
}

describe('resume with IndexedDB', () => {
  it('restores decisions after remounting and loading the same file again', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await start(user)
    await user.keyboard('12t')
    expect(screen.getByTestId('counts').textContent).toBe('선택 2 · 동점 1 · 건너뛰기 0')
    // Closing the database waits for pending writes, so unmounting right away is safe.
    first.unmount()

    render(<App />)
    await start(user)
    await vi.waitFor(() => expect(screen.getByTestId('counts').textContent).toBe('선택 2 · 동점 1 · 건너뛰기 0'))
    expect(screen.queryByText(/IndexedDB를 쓸 수 없어/)).toBeNull()
  })
})

describe('fallback without IndexedDB', () => {
  it('shows a banner and restores decisions through the progress file', async () => {
    vi.stubGlobal('indexedDB', undefined)
    const user = userEvent.setup()
    const first = render(<App />)
    expect(await screen.findByText(/IndexedDB를 쓸 수 없어/)).toBeTruthy()
    await start(user)
    await user.keyboard('12t')
    await user.click(screen.getByRole('button', { name: '진행 상황 내려받기' }))
    const backup = await downloads[0]!.blob.text()
    first.unmount()

    render(<App />)
    await start(user)
    expect(screen.getByTestId('counts').textContent).toBe('선택 0 · 동점 0 · 건너뛰기 0')
    await user.upload(screen.getByLabelText(/진행 상황 불러오기/), new File([backup], 'p.json'))
    await vi.waitFor(() => expect(screen.getByTestId('counts').textContent).toBe('선택 2 · 동점 1 · 건너뛰기 0'))
  })

  it('rejects a progress file that belongs to another input file', async () => {
    vi.stubGlobal('indexedDB', undefined)
    const user = userEvent.setup()
    render(<App />)
    await start(user)
    const other = serializeProgress(fingerprint(sample + '\n{}'), [{ id: 's01', choice: 0, shownLeft: 0 }])
    await user.upload(screen.getByLabelText(/진행 상황 불러오기/), new File([other], 'p.json'))
    expect((await screen.findByRole('alert')).textContent).toMatch(/지문 불일치/)
    expect(screen.getByTestId('counts').textContent).toBe('선택 0 · 동점 0 · 건너뛰기 0')
  })
})
