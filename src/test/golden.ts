import { readFileSync, writeFileSync } from 'node:fs'

const dir = new URL('../../fixtures/expected/', import.meta.url)

/** Read a golden file. Run `UPDATE_GOLDEN=1 npm test` to regenerate them after an intentional change. */
export function golden(name: string, actual: string): string {
  const url = new URL(name, dir)
  if (process.env.UPDATE_GOLDEN === '1') writeFileSync(url, actual)
  return readFileSync(url, 'utf8')
}
