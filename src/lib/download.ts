/** Save text as a file through a Blob and a temporary <a download> link (works in every browser). */
export function downloadText(filename: string, text: string, mime = 'application/octet-stream'): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
