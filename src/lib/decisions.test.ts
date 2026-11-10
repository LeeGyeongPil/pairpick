import { describe, expect, it } from 'vitest'
import { applyDecision, nextUndecided, summarize, undoLast } from './decisions.ts'
import type { Decision, Item } from './types.ts'

const item = (id: string, shape: Item['shape'] = 'ab'): Item => ({
  id,
  line: 1,
  prompt: 'p',
  responses: ['a', 'b'],
  shape,
})

describe('decisions', () => {
  const items = [item('1'), item('2'), item('3'), item('4')]

  it('applies decisions, replaces a repeated id, and undoes the last one', () => {
    let ds: Decision[] = []
    ds = applyDecision(ds, { id: '1', choice: 0, shownLeft: 0 })
    ds = applyDecision(ds, { id: '2', choice: 'skip', shownLeft: 1 })
    expect(ds.map((d) => d.id)).toEqual(['1', '2'])
    ds = applyDecision(ds, { id: '1', choice: 1, shownLeft: 0 })
    expect(ds.map((d) => d.id)).toEqual(['2', '1'])
    ds = undoLast(ds)
    expect(ds.map((d) => d.id)).toEqual(['2'])
    expect(undoLast([])).toEqual([])
  })

  it('finds the first row without a decision (skipped rows count as decided)', () => {
    const ds: Decision[] = [
      { id: '1', choice: 0, shownLeft: 0 },
      { id: '2', choice: 'skip', shownLeft: 0 },
    ]
    expect(nextUndecided(items, ds)?.id).toBe('3')
    expect(nextUndecided(items, undoLast(ds))?.id).toBe('2')
  })

  it('summarizes counts and the left-pick rate', () => {
    const ds: Decision[] = [
      { id: '1', choice: 0, shownLeft: 0 }, // picked left
      { id: '2', choice: 1, shownLeft: 0 }, // picked right
      { id: '3', choice: 0, shownLeft: 1 }, // picked right
      { id: '4', choice: 'tie', shownLeft: 0 },
    ]
    const s = summarize(items, ds)
    expect(s).toMatchObject({ total: 4, decided: 4, remaining: 0, picked: 3, ties: 1, skipped: 0 })
    expect(s.leftRate).toBeCloseTo(1 / 3)
    expect(s.ktoDesirable).toBe(3)
    expect(s.agreement).toBeNull()
  })

  it('has a null left rate before any pick', () => {
    expect(summarize(items, []).leftRate).toBeNull()
  })

  it('computes the review agreement rate for chosen/rejected rows', () => {
    const cr = [item('c1', 'chosen_rejected'), item('c2', 'chosen_rejected'), item('c3', 'chosen_rejected'), item('x')]
    const ds: Decision[] = [
      { id: 'c1', choice: 0, shownLeft: 1 }, // agrees with original chosen
      { id: 'c2', choice: 1, shownLeft: 1 }, // disagrees
      { id: 'c3', choice: 0, shownLeft: 0 }, // agrees
      { id: 'x', choice: 0, shownLeft: 0 }, // not a review row
    ]
    expect(summarize(cr, ds).agreement).toEqual({ agreed: 2, compared: 3, rate: 2 / 3 })
  })

  it('counts rows with more than two responses', () => {
    const three: Item = { ...item('t'), responses: ['a', 'b', 'c'] }
    expect(summarize([three, item('u')], []).extraResponseRows).toBe(1)
  })
})
