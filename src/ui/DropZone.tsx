import { useState } from 'react'
import { useT } from './useLang.ts'

type Props = { onText: (text: string, name: string) => void; onSample: () => void }

export function DropZone({ onText, onSample }: Props) {
  const [over, setOver] = useState(false)
  const m = useT()

  const readFile = async (file: File) => onText(await file.text(), file.name)

  return (
    <section
      className={over ? 'dropzone over' : 'dropzone'}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const file = e.dataTransfer.files[0]
        if (file) void readFile(file)
      }}
    >
      <p>{m.dropHint}</p>
      <label className="button">
        {m.chooseFile}
        <input
          type="file"
          accept=".jsonl,.json,.txt,application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void readFile(file)
            e.target.value = ''
          }}
        />
      </label>
      <button type="button" onClick={onSample}>
        {m.startSample}
      </button>
      <p className="hint">{m.sampleHint}</p>
    </section>
  )
}
