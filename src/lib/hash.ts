// FNV-1a 64-bit, pure TypeScript (no crypto API needed, same result in every environment).

const OFFSET = 0xcbf29ce484222325n
const PRIME = 0x100000001b3n
const MASK = 0xffffffffffffffffn

/** Returns the 64-bit FNV-1a hash of the UTF-8 bytes of `text` as 16 hex digits. */
export function fnv1a64(text: string): string {
  let h = OFFSET
  for (const byte of new TextEncoder().encode(text)) {
    h ^= BigInt(byte)
    h = (h * PRIME) & MASK
  }
  return h.toString(16).padStart(16, '0')
}

/** Fingerprint of a file: BOM and CRLF differences do not change it. */
export function fingerprint(text: string): string {
  return fnv1a64(text.replace(/^﻿/, '').replace(/\r\n/g, '\n'))
}
