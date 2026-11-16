export interface StampCoordinates {
  x: number
  y: number
}

export const jobStampCoordinates = (job: {
  STAMP_X?: number | null
  STAMP_Y?: number | null
  STAMP_FONT_SIZE?: number | null
}): StampCoordinates & { fontSize: number } => ({ x: job.STAMP_X ?? 1, y: job.STAMP_Y ?? 0, fontSize: job.STAMP_FONT_SIZE ?? 10 })

export const stampFromPointer = (
  point: { x: number; y: number },
  page: { left: number; top: number; width: number; height: number },
  offset: { x: number; y: number },
  scale: number,
  textWidth: number,
  fontSize = 10
): StampCoordinates => {
  const clamp = (value: number) => Math.max(0, Math.min(1, value))
  return {
    x: clamp((point.x - page.left - offset.x - 18 * scale) / Math.max(1, page.width - (36 + textWidth) * scale)),
    y: clamp((point.y - page.top - offset.y - 18 * scale) / Math.max(1, page.height - (36 + fontSize) * scale))
  }
}

export const resizeStamp = (
  start: { fontSize: number; textWidth: number; left: number; top: number },
  delta: { x: number; y: number },
  corner: { x: number; y: number },
  page: { width: number; height: number }
) => {
  const ratio = 1 + (delta.x * corner.x * start.textWidth + delta.y * corner.y * start.fontSize) /
    Math.max(1, start.textWidth ** 2 + start.fontSize ** 2)
  const fontSize = Math.round(Math.max(6, Math.min(48, start.fontSize * ratio)) * 10) / 10
  const textWidth = start.textWidth * fontSize / start.fontSize
  const left = start.left + (corner.x < 0 ? start.textWidth - textWidth : 0)
  const top = start.top + (corner.y < 0 ? start.fontSize - fontSize : 0)
  const coordinates = stampFromPointer(
    { x: left, y: top }, { left: 0, top: 0, ...page }, { x: 0, y: 0 }, 1, textWidth, fontSize
  )
  return { fontSize, coordinates }
}
