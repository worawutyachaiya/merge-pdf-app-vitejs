import { isSystemFont, textFont, usesCustomFont, type TextStyle } from './textFormatting'

export interface StampCoordinates {
  x: number
  y: number
}

export const stampVerticalMetrics = (size: number, style: TextStyle) => {
  const custom = usesCustomFont(style)
  const system = isSystemFont(style.fontFamily)
  const baseline = size * (custom ? 0.8 : 0.74)
  const height = size * (custom ? (style.underline ? 0.90 : system ? 0.86 : 0.83) : (style.underline ? 0.84 : 0.76))
  return { baseline, height }
}
const margin = 18

export const jobStampCoordinates = (job: {
  STAMP_X?: number | null
  STAMP_Y?: number | null
  STAMP_FONT_SIZE?: number | null
  STAMP_STYLE?: TextStyle | null
}): StampCoordinates & { fontSize: number; style?: TextStyle } => ({
  x: job.STAMP_X ?? 1, y: job.STAMP_Y ?? 0, fontSize: job.STAMP_FONT_SIZE ?? 10, style: job.STAMP_STYLE ?? undefined
})

export const indexFont = (style: TextStyle, size: number): string =>
  `${style.italic ? 'italic' : 'normal'} ${style.bold ? 700 : 400} ${size}px ${textFont(style)}`

// Standard PDF font advances for the I, hyphen and tabular digits in a job code.
export const indexTextWidth = (name: string, size: number, style: TextStyle): number => {
  if (!usesCustomFont(style) && /^I\d{2}-\d{4,}$/.test(name)) {
    if (style.fontFamily === 'mono') return name.length * 0.6 * size
    const digits = name.length - 2
    return style.fontFamily === 'serif'
      ? ((style.bold ? 0.389 : 0.333) + 0.333 + digits * 0.5) * size
      : (0.278 + 0.333 + digits * 0.556) * size
  }
  const context = document.createElement('canvas').getContext('2d')
  if (!context) return name.length * size * 0.556
  context.font = indexFont(style, 1000)
  context.fontKerning = 'none'
  return context.measureText(name).width * size / 1000
}

const stampAxis = (pageLength: number, textLength: number, nearInset: number, farInset: number) => {
  const travel = Math.max(0, pageLength - textLength)
  const start = Math.min(travel, nearInset)
  const end = Math.max(start, travel - farInset)
  return { travel, start, end }
}

// Match the export geometry in PdfEngine. Existing coordinates use the inset area.
const stampAxes = (page: { width: number; height: number }, textWidth: number, fontSize: number, style: TextStyle = {}) => {
  const { baseline, height } = stampVerticalMetrics(fontSize, style)
  return {
    x: stampAxis(page.width, textWidth, margin, margin),
    y: stampAxis(page.height, height, margin + fontSize - baseline, margin + baseline - height)
  }
}

const offsetAt = (position: number, { start, end, travel }: ReturnType<typeof stampAxis>) => {
  if (position < 0) return start * (1 + position)
  if (position > 1) return end + (travel - end) * (position - 1)
  return start + (end - start) * position
}

const positionAt = (offset: number, { start, end, travel }: ReturnType<typeof stampAxis>) => {
  const clamped = Math.max(0, Math.min(travel, offset))
  if (clamped < start) return clamped / start - 1
  if (clamped > end) return 1 + (clamped - end) / (travel - end)
  return end === start ? 0 : (clamped - start) / (end - start)
}

export const stampOffset = (
  position: StampCoordinates,
  page: { width: number; height: number },
  textWidth: number,
  fontSize: number,
  style?: TextStyle
): StampCoordinates => {
  const axes = stampAxes(page, textWidth, fontSize, style)
  return { x: offsetAt(position.x, axes.x), y: offsetAt(position.y, axes.y) }
}

export const stampCoordinatesAtOffset = (
  offset: StampCoordinates,
  page: { width: number; height: number },
  textWidth: number,
  fontSize: number,
  style?: TextStyle
): StampCoordinates => {
  const axes = stampAxes(page, textWidth, fontSize, style)
  return { x: positionAt(offset.x, axes.x), y: positionAt(offset.y, axes.y) }
}

export const resizeStamp = (
  start: { fontSize: number; textWidth: number; left: number; top: number },
  delta: { x: number; y: number },
  corner: { x: number; y: number },
  page: { width: number; height: number },
  style: TextStyle = {}
) => {
  const startHeight = stampVerticalMetrics(start.fontSize, style).height
  const ratio = 1 + (delta.x * corner.x * start.textWidth + delta.y * corner.y * startHeight) /
    Math.max(1, start.textWidth ** 2 + startHeight ** 2)
  const fontSize = Math.round(Math.max(6, Math.min(48, start.fontSize * ratio)) * 10) / 10
  const textWidth = start.textWidth * fontSize / start.fontSize
  const left = start.left + (corner.x < 0 ? start.textWidth - textWidth : 0)
  const top = start.top + (corner.y < 0 ? startHeight - stampVerticalMetrics(fontSize, style).height : 0)
  const coordinates = stampCoordinatesAtOffset({ x: left, y: top }, page, textWidth, fontSize, style)
  return { fontSize, coordinates }
}
