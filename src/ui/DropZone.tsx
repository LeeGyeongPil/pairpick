import { useState } from 'react'

type Props = { onText: (text: string, name: string) => void; onSample: () => void }

export function DropZone({ onText, onSample }: Props) {
  const [over, setOver] = useState(false)

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
      <p>응답 두 개가 든 JSONL 또는 JSON 배열 파일을 여기로 끌어다 놓으세요. 파일은 이 브라우저 밖으로 나가지 않습니다.</p>
      <label className="button">
        JSONL 파일 선택
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
        샘플로 시작
      </button>
      <p className="hint">샘플은 연습용으로 직접 만든 12행이며 실제 모델 출력이 아닙니다.</p>
    </section>
  )
}
