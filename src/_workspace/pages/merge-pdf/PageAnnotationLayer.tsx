import { useRef, useState } from 'react'
import { Box, GlobalStyles, IconButton } from '@mui/material'
import { moveAnnotation, resizeAnnotation, type PageAnnotation } from './pageAnnotations'

interface Props {
  annotations: PageAnnotation[]
  width: number
  height: number
  scale: number
  cursor: string
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChange?: (items: PageAnnotation[]) => void
}

export default function PageAnnotationLayer({ annotations, width, height, scale, cursor, selectedId, onSelect, onChange }: Props) {
  const drag = useRef<{
    pointerId: number; x: number; y: number; item: PageAnnotation;
    corner?: { x: number; y: number }; preview: PageAnnotation
  } | null>(null)
  const [preview, setPreview] = useState<PageAnnotation | null>(null)
  const update = (item: PageAnnotation) => onChange?.(annotations.map(current => current.id === item.id ? item : current))
  const finish = (commit: boolean) => {
    const current = drag.current
    drag.current = null
    if (commit && current) update(current.preview)
    setPreview(null)
  }
  const begin = (event: React.PointerEvent<HTMLElement>, item: PageAnnotation, corner?: { x: number; y: number }) => {
    event.stopPropagation()
    if (!onChange || event.button !== 0) return
    event.preventDefault()
    onSelect(item.id)
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, item, corner, preview: item }
    setPreview(item)
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const gesture = {
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      event.stopPropagation()
      const current = drag.current
      if (!current || event.pointerId !== current.pointerId) return
      const dx = event.clientX - current.x, dy = event.clientY - current.y
      current.preview = current.corner
        ? resizeAnnotation(current.item, { x: dx, y: dy }, current.corner, { width, height })
        : moveAnnotation(current.item, dx / width, dy / height)
      setPreview(current.preview)
    },
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
      event.stopPropagation()
      if (drag.current?.pointerId !== event.pointerId) return
      finish(true)
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    },
    onPointerCancel: (event: React.PointerEvent<HTMLElement>) => { event.stopPropagation(); finish(false) },
    onLostPointerCapture: (event: React.PointerEvent<HTMLElement>) => { event.stopPropagation(); finish(false) }
  }
  return (
    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {preview && <GlobalStyles styles={{ '*, *::before, *::after': { cursor: `${cursor} !important` } }} />}
      {annotations.map(saved => {
        const item = preview?.id === saved.id ? preview : saved
        const selected = item.id === selectedId && !!onChange
        return (
          <Box key={item.id}
            onPointerDown={event => { event.stopPropagation(); onSelect(item.id) }}
            onKeyDown={event => {
              event.stopPropagation()
              if (!onChange || event.target !== event.currentTarget) return
              if (event.key === 'Delete' || event.key === 'Backspace') {
                event.preventDefault(); onChange(annotations.filter(other => other.id !== item.id)); onSelect(null)
              } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                event.preventDefault()
                const step = event.shiftKey ? 10 : 1
                update(moveAnnotation(item, (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0) / width,
                  (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0) / height))
              }
            }}
            tabIndex={onChange ? 0 : undefined}
            aria-label={item.kind === 'remark' ? 'Remark, visible only in editor' : 'E-stamp'}
            sx={{
              position: 'absolute', left: item.x * width, top: item.y * height,
              width: item.width * width, height: item.height * height,
              pointerEvents: 'auto', outline: selected ? '2px solid' : item.kind === 'remark' ? '1px dashed' : 'none',
              outlineColor: selected ? 'primary.main' : '#a67c00', zIndex: selected ? 3 : 1,
              bgcolor: item.kind === 'remark' ? '#fff4b8' : 'transparent', cursor, touchAction: 'none'
            }}>
            {item.kind === 'estamp' ? (
              <Box component='img' src={item.image} alt='E-stamp' draggable={false}
                onPointerDown={event => begin(event, item)} {...gesture}
                sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', cursor, userSelect: 'none' }} />
            ) : (
              <>
                <Box onPointerDown={event => begin(event, item)} {...gesture}
                  title='Drag to move remark · visible only in editor'
                  sx={{ height: Math.max(18, 15 * scale), px: 0.5, bgcolor: '#f0d76c', color: '#4b3900',
                    fontSize: Math.max(10, 9 * scale), overflow: 'hidden', whiteSpace: 'nowrap', cursor }}>
                  <i className='tabler-grip-horizontal' /> Remark · Edit only
                </Box>
                <Box component='textarea' value={item.text} readOnly={!onChange}
                  aria-label='Remark text, not included in PDF' maxLength={2000}
                  onChange={event => update({ ...item, text: event.target.value })}
                  onPointerDown={event => { event.stopPropagation(); onSelect(item.id) }}
                  sx={{ display: 'block', width: '100%', height: `calc(100% - ${Math.max(18, 15 * scale)}px)`,
                    minHeight: 0, resize: 'none', border: 0, outline: 0, bgcolor: 'transparent', color: '#332b00',
                    fontFamily: 'Arial, sans-serif', fontSize: Math.max(10, 12 * scale), p: 0.5, boxSizing: 'border-box' }} />
              </>
            )}
            {selected && (
              <>
                <IconButton size='small' aria-label={`Remove ${item.kind === 'remark' ? 'remark' : 'E-stamp'}`}
                  onPointerDown={event => event.stopPropagation()}
                  onClick={event => { event.stopPropagation(); onChange?.(annotations.filter(other => other.id !== item.id)); onSelect(null) }}
                  sx={{ position: 'absolute', top: 2, right: 2, width: 24, height: 24, bgcolor: 'background.paper', color: 'error.main', boxShadow: 1 }}>
                  <i className='tabler-x' />
                </IconButton>
                {[{ x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }].map(corner => (
                  <Box key={`${corner.x}:${corner.y}`} component='span' role='button' tabIndex={0}
                    aria-label={`Resize ${item.kind} ${corner.x < 0 ? 'left' : 'right'} ${corner.y < 0 ? 'top' : 'bottom'}`}
                    onPointerDown={event => begin(event, item, corner)} {...gesture}
                    onKeyDown={event => {
                      event.stopPropagation()
                      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return
                      event.preventDefault()
                      update(resizeAnnotation(item, { x: event.key === 'ArrowLeft' ? -4 : event.key === 'ArrowRight' ? 4 : 0,
                        y: event.key === 'ArrowUp' ? -4 : event.key === 'ArrowDown' ? 4 : 0 }, corner, { width, height }))
                    }}
                    sx={{ position: 'absolute', ...(corner.x < 0 ? { left: -5 } : { right: -5 }),
                      ...(corner.y < 0 ? { top: -5 } : { bottom: -5 }), width: 10, height: 10,
                      border: '2px solid', borderColor: 'primary.main', bgcolor: 'common.white', cursor, touchAction: 'none' }} />
                ))}
              </>
            )}
          </Box>
        )
      })}
    </Box>
  )
}
