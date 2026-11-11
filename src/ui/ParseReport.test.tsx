// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import array from '../../fixtures/inputs/array.json?raw'
import broken from '../../fixtures/inputs/broken.jsonl?raw'
import { parseJsonl } from '../lib/parse.ts'
import { ParseReport } from './ParseReport.tsx'

const show = (text: string) => render(<ParseReport fileName="f" bytes={text.length} result={parseJsonl(text)} />)

describe('ParseReport', () => {
  it('guides on an empty file and whitespace-only file', () => {
    const { unmount } = show('')
    expect(screen.getByText(/읽을 행이 없습니다\. 빈 파일이거나 공백만 있습니다/)).toBeTruthy()
    unmount()
    show('  \n \n')
    expect(screen.getByText(/읽을 행이 없습니다/)).toBeTruthy()
  })

  it('guides on an empty array', () => {
    show('[]')
    expect(screen.getByText(/배열이 비어 있어 읽을 행이 없습니다/)).toBeTruthy()
  })

  it('labels array mode items and summary', () => {
    show(array)
    expect(screen.getByText(/4번째 항목/)).toBeTruthy()
    expect(screen.getByText(/오류 1항목/)).toBeTruthy()
    expect(screen.getByText(/JSON 배열/)).toBeTruthy()
  })

  it('keeps JSONL wording unchanged', () => {
    show(broken)
    expect(screen.getByText(/3번째 줄/)).toBeTruthy()
    expect(screen.getByText(/오류 2줄/)).toBeTruthy()
    expect(screen.queryByText(/항목/)).toBeNull()
    expect(screen.queryByText(/읽을 행이 없습니다/)).toBeNull()
  })
})
