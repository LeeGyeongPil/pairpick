import { useT } from './useLang.ts'

export function StorageBanner() {
  const m = useT()
  return (
    <p className="banner" role="status">
      {m.storageBanner}
    </p>
  )
}
