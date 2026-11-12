import { useSyncExternalStore } from 'react'
import { getLang, MESSAGES, subscribe, type Lang, type Messages } from '../i18n.ts'

/** Current UI language; components re-render when it changes. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, getLang)
}

/** Messages for the current UI language. */
export function useT(): Messages {
  return MESSAGES[useLang()]
}
