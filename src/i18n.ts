// UI text for both languages in one place. `ko` is typed as `Messages`, so a missing or extra key
// is a compile error (tsc -b). Numbers go through function values so English can pick singular/plural.
export type Lang = 'en' | 'ko'

export const LANG_KEY = 'pairpick.lang'
export const LANGS: readonly Lang[] = ['en', 'ko']

const plural = (n: number, one: string, many: string) => n + ' ' + (n === 1 ? one : many)

const en = {
  tagline:
    'Pick the better of two responses with the keyboard and export to TRL and LLaMA-Factory formats. Everything runs inside your browser.',
  languageLabel: 'Language / 언어',
  openAnother: 'Open another file',
  done: 'All rows are done. Export below, or press u to undo.',

  dropHint: 'Drop a JSONL file or JSON array with two responses per row here. Files never leave this browser.',
  chooseFile: 'Choose JSONL file',
  startSample: 'Start with sample',
  sampleHint: 'The sample is 12 hand-written practice rows, not real model output.',

  compareLabel: 'Comparison',
  progressBar: 'Progress bar',
  counter: (i: number, total: number, id: string) => i + ' / ' + total + ' · row ' + id,
  promptTitle: 'Prompt',
  leftResponse: 'Left response',
  rightResponse: 'Right response',
  leftTitle: 'Left (1)',
  rightTitle: 'Right (2)',
  keyLeft: 'left is better',
  keyRight: 'right is better',
  keyTie: 'tie',
  keySkip: 'skip',
  keyUndo: 'undo',

  summaryTitle: 'Summary',
  counts: (picked: number, ties: number, skipped: number) =>
    'Picked ' + picked + ' · ties ' + ties + ' · skipped ' + skipped,
  totals: (total: number, decided: number, remaining: number) =>
    plural(total, 'row', 'rows') + ' total · decided ' + decided + ' · remaining ' + remaining,
  leftRate: (rate: string) => 'Left pick rate: ' + rate,
  biasWarning: 'The left pick rate is far from 50%. Check whether you have a position bias.',
  agreement: (rate: string, agreed: number, compared: number) =>
    'Agreement with original labels: ' + rate + ' (' + agreed + '/' + compared + ')',
  kto: (desirable: number, undesirable: number) => 'KTO examples: desirable ' + desirable + ' · undesirable ' + undesirable,
  extraResponses: (n: number) =>
    plural(n, 'row has', 'rows have') + ' 3 or more responses: only the first two are compared.',

  exportTitle: 'Export',
  exportHint: 'Ties and skips are left out; rows are written in original order.',
  labelStandard: 'TRL standard',
  labelConversational: 'TRL conversational',
  labelKto: 'TRL KTO',
  labelAlpaca: 'LLaMA-Factory alpaca',
  download: (label: string) => 'Download ' + label,
  previewFormat: 'Preview format',
  alpacaExcluded: (n: number) =>
    plural(n, 'multi-turn prompt row is', 'multi-turn prompt rows are') + ' left out of the alpaca format.',
  previewEmpty: '(no selections to export yet)',
  progressBackup: 'Progress backup',
  progressDownload: 'Download progress',
  progressImport: 'Import progress',
  progressImported: (n: number) => 'Progress imported: ' + plural(n, 'decision', 'decisions'),

  storageBanner:
    'IndexedDB is not available in this browser, so your progress will not be saved. Back it up with "Download progress" below before closing the tab.',

  shapeChosenRejected: ' (re-review mode: original labels are hidden)',
  parseHint: 'Provide a file with one JSON object per line (JSONL) or an array of objects (JSON).',
  emptyArray: 'The array is empty, so there are no rows to read.',
  emptyFile: 'No rows to read. The file is empty or only whitespace.',
  reportTitle: 'Read result',
  rowsRead: (n: number) => plural(n, 'row', 'rows') + ' read',
  inputShape: (name: string) => 'input shape ' + name,
  jsonArray: 'JSON array',
  errorCount: (n: number, array: boolean) => plural(n, array ? 'item' : 'line', array ? 'items' : 'lines') + ' with errors',
  largeFile: 'The file is large (over 20 MB or 20,000 rows), so the page may be slow.',
  errorAt: (n: number, array: boolean) => (array ? 'Item ' : 'Line ') + n,
  foundKeys: (keys: string) => ' (keys found: ' + keys + ')',
  noKeys: 'none',
  moreErrors: (n: number, array: boolean) =>
    '... and ' + n + ' more ' + (n === 1 ? (array ? 'item' : 'line') : array ? 'items' : 'lines'),

  badgeIdentical: 'Both responses are identical',
  badgeEmpty: 'Empty response',
  badgeLength: (ratio: string) => 'Length differs ' + ratio + 'x',
  badgeDuplicate: (count: number) => 'Same prompt appears ' + (count === 2 ? 'twice' : count + ' times'),

  progressNotJson: 'Cannot read the progress file: it is not JSON.',
  progressBadFormat: 'The progress file format is wrong. Check that it was downloaded from pairpick.',
  progressOtherFile:
    'This progress file belongs to a different input file (fingerprint mismatch). Import it while the same JSONL file is open.',
  progressBadDecisions: 'The decision list in the progress file has invalid entries.',
}

export type Messages = typeof en

const ko: Messages = {
  tagline: '두 응답 중 나은 것을 키보드로 고르고, TRL·LLaMA-Factory 형식으로 내보냅니다. 모든 처리는 브라우저 안에서 끝납니다.',
  languageLabel: 'Language / 언어',
  openAnother: '다른 파일 열기',
  done: '모든 행을 처리했습니다. 아래에서 내보내거나 u 키로 되돌릴 수 있습니다.',

  dropHint: '응답 두 개가 든 JSONL 또는 JSON 배열 파일을 여기로 끌어다 놓으세요. 파일은 이 브라우저 밖으로 나가지 않습니다.',
  chooseFile: 'JSONL 파일 선택',
  startSample: '샘플로 시작',
  sampleHint: '샘플은 연습용으로 직접 만든 12행이며 실제 모델 출력이 아닙니다.',

  compareLabel: '비교',
  progressBar: '진행 막대',
  counter: (i, total, id) => i + ' / ' + total + ' · 행 ' + id,
  promptTitle: '프롬프트',
  leftResponse: '왼쪽 응답',
  rightResponse: '오른쪽 응답',
  leftTitle: '왼쪽 (1)',
  rightTitle: '오른쪽 (2)',
  keyLeft: '왼쪽이 낫다',
  keyRight: '오른쪽이 낫다',
  keyTie: '동점',
  keySkip: '건너뛰기',
  keyUndo: '되돌리기',

  summaryTitle: '요약',
  counts: (picked, ties, skipped) => '선택 ' + picked + ' · 동점 ' + ties + ' · 건너뛰기 ' + skipped,
  totals: (total, decided, remaining) => '전체 ' + total + '행 · 결정 ' + decided + ' · 남음 ' + remaining,
  leftRate: (rate) => '왼쪽 선택률: ' + rate,
  biasWarning: '왼쪽 선택률이 50%에서 많이 벗어났습니다. 위치 편향이 있는지 확인하세요.',
  agreement: (rate, agreed, compared) => '원래 라벨과 일치율: ' + rate + ' (' + agreed + '/' + compared + ')',
  kto: (desirable, undesirable) => 'KTO 예시: 원하는 ' + desirable + ' · 원치 않는 ' + undesirable,
  extraResponses: (n) => '응답이 3개 이상인 행 ' + n + '개: 앞의 두 개만 비교합니다.',

  exportTitle: '내보내기',
  exportHint: '동점·건너뛰기는 제외하고, 원본 행 순서로 씁니다.',
  labelStandard: 'TRL 표준',
  labelConversational: 'TRL 대화형',
  labelKto: 'TRL KTO',
  labelAlpaca: 'LLaMA-Factory alpaca',
  download: (label) => label + ' 다운로드',
  previewFormat: '미리보기 형식',
  alpacaExcluded: (n) => '여러 턴 프롬프트 ' + n + '행은 alpaca 형식에서 제외됩니다.',
  previewEmpty: '(아직 내보낼 선택이 없습니다)',
  progressBackup: '진행 상황 백업',
  progressDownload: '진행 상황 내려받기',
  progressImport: '진행 상황 불러오기',
  progressImported: (n) => '진행 상황을 불러왔습니다: 결정 ' + n + '개',

  storageBanner:
    '이 브라우저에서는 IndexedDB를 쓸 수 없어 이어하기가 저장되지 않습니다. 탭을 닫기 전에 아래 "진행 상황 내려받기"로 백업하세요.',

  shapeChosenRejected: ' (재검토 모드: 원래 라벨은 숨김)',
  parseHint: '한 줄에 JSON 객체 하나(JSONL) 또는 객체 배열(JSON) 파일을 넣어 주세요.',
  emptyArray: '배열이 비어 있어 읽을 행이 없습니다.',
  emptyFile: '읽을 행이 없습니다. 빈 파일이거나 공백만 있습니다.',
  reportTitle: '읽기 결과',
  rowsRead: (n) => n + '행 읽음',
  inputShape: (name) => '입력 모양 ' + name,
  jsonArray: 'JSON 배열',
  errorCount: (n, array) => '오류 ' + n + (array ? '항목' : '줄'),
  largeFile: '파일이 커서(20MB 또는 2만 행 초과) 화면이 느려질 수 있습니다.',
  errorAt: (n, array) => n + '번째 ' + (array ? '항목' : '줄'),
  foundKeys: (keys) => ' (찾은 키: ' + keys + ')',
  noKeys: '없음',
  moreErrors: (n, array) => '... 외 ' + n + (array ? '항목' : '줄'),

  badgeIdentical: '두 응답이 같음',
  badgeEmpty: '빈 응답',
  badgeLength: (ratio) => '길이 ' + ratio + '배 차이',
  badgeDuplicate: (count) => '같은 프롬프트가 ' + count + '번 나옴',

  progressNotJson: '진행 파일을 읽을 수 없습니다: JSON 형식이 아닙니다.',
  progressBadFormat: '진행 파일 형식이 맞지 않습니다. pairpick이 내려받은 파일인지 확인하세요.',
  progressOtherFile: '이 진행 파일은 다른 입력 파일의 것입니다(지문 불일치). 같은 JSONL 파일을 연 상태에서 불러오세요.',
  progressBadDecisions: '진행 파일의 결정 목록에 잘못된 항목이 있습니다.',
}

export const MESSAGES: Record<Lang, Messages> = { en, ko }

/** Browser language -> UI language: anything starting with "ko" is Korean, everything else English. */
export function detectLang(): Lang {
  const nav = typeof navigator === 'undefined' ? undefined : navigator
  const tag = nav?.language || nav?.languages?.[0] || ''
  return tag.toLowerCase().startsWith('ko') ? 'ko' : 'en'
}

function readStored(): Lang | null {
  try {
    const v = localStorage.getItem(LANG_KEY)
    return v === 'en' || v === 'ko' ? v : null
  } catch {
    return null // private mode or no localStorage (node)
  }
}

let current: Lang = readStored() ?? detectLang()
const listeners = new Set<() => void>()

function applyHtmlLang(): void {
  if (typeof document !== 'undefined') document.documentElement.lang = current
}

export const getLang = (): Lang => current

/** Messages for the current language (for non-React code such as lib/quality.ts). */
export const t = (): Messages => MESSAGES[current]

/** Change the language. `persist` is true only for the user's own choice; auto-detection is never saved. */
export function setLang(lang: Lang, persist = false): void {
  current = lang
  if (persist) {
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
      // storage unavailable: the choice still applies for this session
    }
  }
  applyHtmlLang()
  listeners.forEach((l) => l())
}

/** Re-run the first-run decision (saved value, else browser language) without saving anything. */
export function resetLang(): void {
  setLang(readStored() ?? detectLang())
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

applyHtmlLang()
