// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App.tsx'
import { fingerprint } from '../lib/hash.ts'
import { shownLeft } from '../lib/order.ts'
import { parseJsonl } from '../lib/parse.ts'
import sample from '../sample/sample.jsonl?raw'
import { downloads } from '../test/setup.ts'

describe('labeling flow', () => {
  it('starts from the sample, reacts to 1 2 t s u, and downloads a matching TRL file', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '샘플로 시작' }))
    expect((await screen.findByTestId('counts')).textContent).toBe('선택 0 · 동점 0 · 건너뛰기 0')

    await user.keyboard('1') // s01: left card wins
    await user.keyboard('2') // s02: right card wins
    await user.keyboard('t') // s03: tie
    await user.keyboard('s') // s04: skip
    expect(screen.getByTestId('counts').textContent).toBe('선택 2 · 동점 1 · 건너뛰기 1')
    await user.keyboard('u') // undo the skip, back on s04
    expect(screen.getByTestId('counts').textContent).toBe('선택 2 · 동점 1 · 건너뛰기 0')
    expect(screen.getByText(/4 \/ 12/)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'TRL 표준 다운로드' }))
    expect(downloads).toHaveLength(1)
    expect(downloads[0]?.filename).toBe('sample.trl-pref.jsonl')
    const lines = (await downloads[0]!.blob.text()).trimEnd().split('\n')
    expect(lines).toHaveLength(2)

    // Expected first line: key 1 picks whichever response was shown on the left for row s01.
    const item = parseJsonl(sample).items[0]!
    const left = shownLeft(fingerprint(sample), item.id)
    const chosen = item.responses[left]
    const rejected = item.responses[left === 0 ? 1 : 0]
    expect(JSON.parse(lines[0]!)).toEqual({ prompt: item.prompt, chosen, rejected })
  })

  it('shows quality badges for flagged rows', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '샘플로 시작' }))
    await screen.findByTestId('counts')
    // s05 is the fifth row (identical responses): skip the first four.
    await user.keyboard('ssss')
    expect(screen.getByText('두 응답이 같음')).toBeTruthy()
  })

  it('reports broken lines after loading a file', async () => {
    const user = userEvent.setup()
    render(<App />)
    const file = new File(['{"prompt":"p","responses":["a","b"]}\n{oops\n'], 'x.jsonl')
    await user.upload(screen.getByLabelText(/JSONL 파일 선택/), file)
    expect(await screen.findByText(/2번째 줄: invalid JSON/)).toBeTruthy()
    expect(screen.getByText(/1행 읽음/)).toBeTruthy()
  })
})
