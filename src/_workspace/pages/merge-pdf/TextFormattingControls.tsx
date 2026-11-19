import { useState } from 'react'
import { Box, IconButton, Tooltip } from '@mui/material'
import { fontFamilies, fontVariant, isSystemFont, type FontFamily, type SystemFontAvailability, type TextStyle } from './textFormatting'

const toggles = [
  { key: 'bold', label: 'Bold', icon: 'bold' },
  { key: 'italic', label: 'Italic', icon: 'italic' },
  { key: 'underline', label: 'Underline', icon: 'underline' },
  { key: 'strikethrough', label: 'Strikethrough', icon: 'strikethrough' }
] as const

export const AnnotationColor = ({ label, color, onChange }: {
  label: string
  color: string
  onChange: (color: string) => void
}) => (
  <Box
    component='input'
    type='color'
    aria-label={label}
    title={label}
    value={color}
    onChange={event => onChange(event.target.value)}
    sx={{ width: 28, height: 26, p: 0, border: 0, bgcolor: 'transparent', cursor: 'pointer' }}
  />
)

interface Props {
  style: TextStyle
  size: number
  maxSize: number
  systemFonts: SystemFontAvailability
  onStyleChange: (fields: Partial<TextStyle>) => void
  onSizeChange: (size: number) => void
}

export default function TextFormattingControls({ style, size, maxSize, systemFonts, onStyleChange, onSizeChange }: Props) {
  const [sizeInput, setSizeInput] = useState<string | null>(null)
  const variants = isSystemFont(style.fontFamily) ? systemFonts[style.fontFamily] ?? [] : null
  const chooseFamily = (fontFamily: FontFamily) => {
    if (!isSystemFont(fontFamily)) {
      onStyleChange({ fontFamily })
      return
    }
    const available = systemFonts[fontFamily] ?? []
    const current = fontVariant(style)
    const variant = [current, current & 1, current & 2, ...available].find(face => available.includes(face))
    if (variant !== undefined) onStyleChange({ fontFamily, bold: !!(variant & 1), italic: !!(variant & 2) })
  }
  const fieldStyle = {
    height: 30, px: 1, fontSize: 13, color: 'text.primary', bgcolor: 'background.paper',
    border: 1, borderColor: 'divider', borderRadius: 0.5
  }
  return (
    <>
      <Box
        component='select'
        aria-label='Font family'
        title='Font family'
        value={style.fontFamily ?? 'sans'}
        onChange={event => chooseFamily(event.target.value as FontFamily)}
        sx={fieldStyle}
      >
        {(Object.keys(fontFamilies) as FontFamily[]).map(value => (
          <option key={value} value={value} disabled={isSystemFont(value) && !systemFonts[value]?.length}>
            {fontFamilies[value].label}
          </option>
        ))}
      </Box>
      <Box
        component='input'
        type='number'
        aria-label='Font size in points'
        title={`Font size (6–${maxSize} pt)`}
        min={6}
        max={maxSize}
        step={0.1}
        value={sizeInput ?? size}
        onChange={event => {
          const input = event.target.value
          setSizeInput(input)
          const next = Number(input)
          if (input && next >= 6 && next <= maxSize) onSizeChange(next)
        }}
        onBlur={() => setSizeInput(null)}
        sx={{ ...fieldStyle, width: 66 }}
      />
      {toggles.map(({ key, label, icon }) => (
        <Tooltip key={key} title={label}>
          <span>
            <IconButton
              size='small'
              aria-label={label}
              aria-pressed={!!style[key]}
              disabled={!!variants && (key === 'bold' || key === 'italic') && !variants.includes(fontVariant({ ...style, [key]: !style[key] }))}
              color={style[key] ? 'primary' : 'default'}
              sx={{ bgcolor: style[key] ? 'action.selected' : undefined }}
              onClick={() => onStyleChange({ [key]: !style[key] })}
            >
              <i className={`tabler-${icon}`} />
            </IconButton>
          </span>
        </Tooltip>
      ))}
      <AnnotationColor label='Text color' color={style.color ?? '#000000'} onChange={color => onStyleChange({ color })} />
    </>
  )
}
