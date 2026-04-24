/** Extract PLO UUID from scanned QR text (full URL or bare id). */
export function parsePloIdFromQr(text: string): string | null {
  const trimmed = text.trim()
  const fromPath = trimmed.match(/\/inspect\/([^/?#]+)/i)
  if (fromPath?.[1]) return fromPath[1]
  if (/^[0-9a-f-]{36}$/i.test(trimmed)) return trimmed
  return null
}
