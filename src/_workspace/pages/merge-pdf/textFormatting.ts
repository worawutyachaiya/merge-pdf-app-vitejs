export const fontFamilies = {
  sans: { label: 'Sans serif', css: 'Arial, sans-serif' },
  serif: { label: 'Serif', css: '"Times New Roman", serif' },
  mono: { label: 'Monospace', css: '"Courier New", monospace' },
  inter: { label: 'Inter', css: 'Inter, sans-serif' },
  'roboto-condensed': { label: 'Roboto Condensed', css: '"Roboto Condensed", sans-serif' },
  montserrat: { label: 'Montserrat', css: 'Montserrat, sans-serif' },
  'source-sans-3': { label: 'Source Sans 3', css: '"Source Sans 3", sans-serif' },
  lora: { label: 'Lora', css: 'Lora, serif' },
  'ibm-plex-mono': { label: 'IBM Plex Mono', css: '"IBM Plex Mono", monospace' },
  sarabun: { label: 'Sarabun', css: 'Sarabun, sans-serif' },
  tahoma: { label: 'Tahoma', css: 'sans-serif', localFaces: ['Tahoma', 'Tahoma Bold'] },
  'ms-gothic': { label: 'MS Gothic', css: 'monospace', localFaces: ['MS Gothic'] },
  'comic-sans-ms': {
    label: 'Comic Sans MS', css: 'sans-serif',
    localFaces: ['Comic Sans MS', 'Comic Sans MS Bold', 'Comic Sans MS Italic', 'Comic Sans MS Bold Italic']
  },
  'angsana-new': {
    label: 'Angsana New', css: 'serif',
    localFaces: ['Angsana New', 'Angsana New Bold', 'Angsana New Italic', 'Angsana New Bold Italic']
  },
  'times-new-roman': {
    label: 'Times New Roman', css: 'serif',
    localFaces: ['Times New Roman', 'Times New Roman Bold', 'Times New Roman Italic', 'Times New Roman Bold Italic']
  }
} as const

export type FontFamily = keyof typeof fontFamilies
type SystemFontFamily = { [Family in FontFamily]: 'localFaces' extends keyof typeof fontFamilies[Family] ? Family : never }[FontFamily]
export type SystemFontAvailability = Partial<Record<SystemFontFamily, number[]>>
export type SystemFontInfo = { family: SystemFontFamily; variants: number[] }

export interface TextStyle {
  fontFamily?: FontFamily
  color?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
}

export const isSystemFont = (family: FontFamily | undefined): family is SystemFontFamily =>
  !!family && 'localFaces' in fontFamilies[family]

const localAlias = (family: SystemFontFamily) => `PDF Editor ${fontFamilies[family].label}`

export const textFont = (style: TextStyle) => {
  const family = style.fontFamily ?? 'sans'
  return isSystemFont(family) ? `"${localAlias(family)}", ${fontFamilies[family].css}` : fontFamilies[family].css
}

export const usesCustomFont = (style: TextStyle) =>
  style.fontFamily !== undefined && !['sans', 'serif', 'mono'].includes(style.fontFamily)

export const fontVariant = (style: TextStyle): number => Number(!!style.bold) + 2 * Number(!!style.italic)

// Browser-side font discovery stays local. FontFace loads from the device's OS font catalog.
export const loadLocalSystemFonts = async (): Promise<SystemFontAvailability> => {
  const families = (Object.keys(fontFamilies) as FontFamily[]).filter(isSystemFont)
  const entries = await Promise.all(families.map(async family => {
    const variants = await Promise.allSettled(fontFamilies[family].localFaces.map(async (name, variant) => {
      const face = new FontFace(localAlias(family), `local(${JSON.stringify(name)})`, {
        weight: variant & 1 ? '700' : '400',
        style: variant & 2 ? 'italic' : 'normal'
      })
      document.fonts.add(await face.load())
      return variant
    }))
    return [family, variants.flatMap(face => face.status === 'fulfilled' ? [face.value] : [])] as const
  }))
  return Object.fromEntries(entries)
}
