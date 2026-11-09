export interface AnnotationPlacement {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export type PageAnnotation = AnnotationPlacement & (
  { kind: 'remark'; text: string } | { kind: 'estamp'; image: string }
)

// UAT runs on HTTP; getRandomValues works there while randomUUID requires HTTPS.
export const annotationId = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 15) | 64
  bytes[8] = (bytes[8] & 63) | 128
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export const moveAnnotation = (item: PageAnnotation, dx: number, dy: number): PageAnnotation => ({
  ...item,
  x: Math.max(0, Math.min(1 - item.width, item.x + dx)),
  y: Math.max(0, Math.min(1 - item.height, item.y + dy))
})

export const resizeAnnotation = (
  item: PageAnnotation, delta: { x: number; y: number }, corner: { x: number; y: number },
  page: { width: number; height: number }
): PageAnnotation => {
  const anchorX = item.x + (corner.x < 0 ? item.width : 0)
  const anchorY = item.y + (corner.y < 0 ? item.height : 0)
  const maxWidth = corner.x < 0 ? anchorX : 1 - anchorX
  const maxHeight = corner.y < 0 ? anchorY : 1 - anchorY
  let width: number, height: number
  if (item.kind === 'estamp') {
    const w = item.width * page.width, h = item.height * page.height
    const ratio = 1 + (delta.x * corner.x * w + delta.y * corner.y * h) / Math.max(1, w * w + h * h)
    const minRatio = Math.max(0.01 / item.width, 0.01 / item.height)
    const fit = Math.min(maxWidth / item.width, maxHeight / item.height)
    const factor = Math.max(Math.min(minRatio, fit), Math.min(fit, ratio))
    width = item.width * factor
    height = item.height * factor
  } else {
    width = Math.max(0.01, Math.min(maxWidth, item.width + delta.x * corner.x / page.width))
    height = Math.max(0.01, Math.min(maxHeight, item.height + delta.y * corner.y / page.height))
  }
  return { ...item, x: corner.x < 0 ? anchorX - width : anchorX, y: corner.y < 0 ? anchorY - height : anchorY, width, height }
}

export const loadEStampImage = async (file: File): Promise<{ image: string; width: number; height: number }> => {
  if (!['image/png', 'image/jpeg'].includes(file.type)) throw new Error('Choose a PNG or JPEG image.')
  if (file.size > 2 * 1024 * 1024) throw new Error('Choose an E-stamp image up to 2 MB.')
  const bitmap = await createImageBitmap(file)
  try {
    const factor = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * factor))
    canvas.height = Math.max(1, Math.round(bitmap.height * factor))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not load this E-stamp image.')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    // Normalize orientation and retain PNG transparency for PDF and preview alike.
    const image = canvas.toDataURL('image/png')
    if (image.length > 2_796_226) throw new Error('This image is too large after processing. Choose a smaller image.')
    return { image, width: canvas.width, height: canvas.height }
  } finally { bitmap.close() }
}
