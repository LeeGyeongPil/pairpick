import { fnv1a64 } from './hash.ts'

/** mulberry32: tiny seeded PRNG, returns a function giving floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Which response (original index 0 or 1) is shown on the left for a row.
 * Deterministic in (file fingerprint, row id), so a reload shows the same layout.
 */
export function shownLeft(fingerprint: string, id: string): 0 | 1 {
  const seed = Number(BigInt('0x' + fnv1a64(fingerprint + ':' + id)) & 0xffffffffn)
  return mulberry32(seed)() < 0.5 ? 0 : 1
}
