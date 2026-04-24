/** Resize + JPEG compress until under maxBytes (default 1MB). */
export async function compressImageFile(file: File, maxBytes = 1_000_000): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  let width = bitmap.width
  let height = bitmap.height
  const maxWidth = 1920
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const toBlob = (quality: number) =>
    new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
    })

  let quality = 0.88
  let blob = await toBlob(quality)
  while (blob && blob.size > maxBytes && quality > 0.35) {
    quality -= 0.07
    blob = await toBlob(quality)
  }
  return blob ?? file
}
