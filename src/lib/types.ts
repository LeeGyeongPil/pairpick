// Shared types. Everything here is plain data so it can be stored and exported as JSON.

export type Msg = { role: string; content: string }
export type Prompt = string | Msg[]

/** Which input shape a row had. */
export type Shape = 'responses' | 'ab' | 'chosen_rejected'

export type Item = {
  /** Row id: the file's `id` field, or the 1-based line number. Unique within a file. */
  id: string
  /** 1-based line number in the source file. */
  line: number
  prompt: Prompt
  /** All responses in original order. Only the first two are compared in M1. */
  responses: string[]
  shape: Shape
}

/** 0/1 = index of the preferred response (original order), or tie / skip. */
export type Choice = 0 | 1 | 'tie' | 'skip'

export type Decision = {
  id: string
  choice: Choice
  /** Index of the response that was shown on the left (records the shuffled layout). */
  shownLeft: 0 | 1
}

export type ParseError = {
  line: number
  message: string
  /** Top-level keys that were found, for rows that parsed as JSON but were not recognized. */
  keys?: string[]
}

export type ParseResult = {
  items: Item[]
  errors: ParseError[]
  /** Shape of the first recognized row, or null when no row was recognized. */
  shape: Shape | null
}
