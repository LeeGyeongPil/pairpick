import type { Msg, Prompt } from './types.ts'

/** A string prompt as a one-message conversation; a message list is returned unchanged. */
export function asMessages(p: Prompt): Msg[] {
  return typeof p === 'string' ? [{ role: 'user', content: p }] : p
}

/**
 * Plain-text form of a prompt for the "standard" (non-conversational) formats.
 * A single message becomes its content; several turns become "role: content" lines.
 */
export function promptText(p: Prompt): string {
  if (typeof p === 'string') return p
  const only = p[0]
  if (p.length === 1 && only) return only.content
  return p.map((m) => m.role + ': ' + m.content).join('\n')
}
