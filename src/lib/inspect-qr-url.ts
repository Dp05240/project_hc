/** URL encoded in work-order QR; opens inspection for this PLO (UUID). */
export function getInspectQrUrl(ploUuid: string): string {
  const base =
    import.meta.env.VITE_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/inspect/${ploUuid}`
}
