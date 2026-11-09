import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Box, Button, CircularProgress, GlobalStyles, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { getDocument, GlobalWorkerOptions, type PDFPageProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { jobStampCoordinates, resizeStamp, stampFromPointer, type StampCoordinates } from './stampPlacement'
import PageAnnotationLayer from './PageAnnotationLayer'
import { annotationId, loadEStampImage, type PageAnnotation } from './pageAnnotations'

GlobalWorkerOptions.workerSrc = workerUrl

// Use one outlined cursor throughout the gesture; native grab/move cursors can
// disappear over the PDF canvas in Edge on Windows.
const previewCursor = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="28" viewBox="0 0 24 28"><path d="M3 2v21l5-5 4 8 4-2-4-8h8Z" fill="black" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>'
)}") 3 2, default`
interface Props {
  previewUrl: string
  pageNumber: number
  visualDeskew?: number
  stamp?: { name: string; coordinates?: StampCoordinates; fontSize?: number }
  onStampMove?: (coordinates: StampCoordinates) => void
  onStampSizeChange?: (fontSize: number, coordinates?: StampCoordinates) => void
  annotations?: PageAnnotation[]
  onAnnotationsChange?: (items: PageAnnotation[]) => void
  onAnnotationBusyChange?: (busy: boolean) => void
}

export default function FitPagePreview({ previewUrl, pageNumber, visualDeskew = 0, stamp, onStampMove, onStampSizeChange, annotations = [], onAnnotationsChange, onAnnotationBusyChange }: Props) {
  const imageInput = useRef<HTMLInputElement | null>(null)
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null)
  const [imageBusy, setImageBusy] = useState(false)
  const [annotationError, setAnnotationError] = useState('')
  const [resizePreview, setResizePreview] = useState<ReturnType<typeof resizeStamp> | null>(null)
  const resizeDrag = useRef<{
    id: number; x: number; y: number; fontSize: number; textWidth: number; left: number; top: number;
    corner: { x: number; y: number }; preview: ReturnType<typeof resizeStamp>
  } | null>(null)
  const stampFontSize = resizePreview?.fontSize ?? stamp?.fontSize ?? 10
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const viewport = useRef<HTMLDivElement | null>(null)
  const stampSurface = useRef<HTMLDivElement | null>(null)
  const stampDrag = useRef<{ id: number; offset: { x: number; y: number }; coordinates: StampCoordinates } | null>(null)
  const [dragPosition, setDragPosition] = useState<StampCoordinates | null>(null)
  const pan = useRef<{ id: number; x: number; y: number; left: number; top: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [page, setPage] = useState<PDFPageProxy | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    setZoom(null)
    viewport.current?.scrollTo(0, 0)
  }, [pageNumber])
  useEffect(() => {
    if (!viewport.current) return
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setSize({ width, height })
    })
    observer.observe(viewport.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const abort = new AbortController()
    let disposed = false
    let task: ReturnType<typeof getDocument> | undefined
    setPage(null)
    setError('')
    setLoading(true)
    void (async () => {
      try {
        const bytes = await (await fetch(previewUrl, { signal: abort.signal })).arrayBuffer()
        if (disposed) return
        const assets = `${import.meta.env.BASE_URL}pdfjs/`
        task = getDocument({
          data: new Uint8Array(bytes),
          cMapUrl: assets + 'cmaps/',
          cMapPacked: true,
          standardFontDataUrl: assets + 'standard_fonts/',
          wasmUrl: assets + 'wasm/'
        })
        const document = await task.promise
        const first = await document.getPage(1)
        if (!disposed) setPage(first)
      } catch (cause) {
        if (!disposed) {
          setError(cause instanceof Error ? cause.message : 'Could not display this PDF')
          setLoading(false)
        }
      }
    })()
    return () => {
      disposed = true
      abort.abort()
      void task?.destroy()
    }
  }, [previewUrl, retry])
  const natural = page?.getViewport({ scale: 1 })
  const fitScale = natural
    ? Math.max(0.05, Math.min((size.width - 32) / natural.width, (size.height - 32) / natural.height))
    : 1
  const scale = zoom ?? fitScale
  const dimensions = natural ? { width: natural.width * scale, height: natural.height * scale } : null
  useEffect(() => {
    if (!page || !canvas.current || !size.width || !size.height) return
    const node = canvas.current,
      screen = page.getViewport({ scale })
    const density = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(16_000_000 / (screen.width * screen.height)))
    const rendered = page.getViewport({ scale: scale * density })
    node.width = Math.ceil(rendered.width)
    node.height = Math.ceil(rendered.height)
    const task = page.render({ canvas: node, viewport: rendered })
    let disposed = false
    setLoading(true)
    void task.promise
      .then(() => {
        if (!disposed) setLoading(false)
      })
      .catch(cause => {
        if (!disposed && cause?.name !== 'RenderingCancelledException') {
          setError('Could not render this page')
          setLoading(false)
        }
      })
    return () => {
      disposed = true
      task.cancel()
    }
  }, [page, scale, size.width, size.height])
  const savedStampCoordinates = stamp?.coordinates ?? jobStampCoordinates({})
  const placedStamp = resizePreview?.coordinates ?? dragPosition ?? savedStampCoordinates
  const stampTextWidth = useMemo(() => {
    const context = document.createElement('canvas').getContext('2d')
    if (!context) return (stamp?.name.length ?? 0) * stampFontSize * 0.556
    context.font = `${stampFontSize}px Arial`
    return context.measureText(stamp?.name ?? '').width
  }, [stamp?.name, stampFontSize])
  const stampLeft = 18 * scale + placedStamp.x * Math.max(0, (dimensions?.width ?? 0) - (36 + stampTextWidth) * scale)
  const stampTop = 18 * scale + placedStamp.y * Math.max(0, (dimensions?.height ?? 0) - (36 + stampFontSize) * scale)
  const zoomTo = (value: number) => setZoom(Math.max(0.1, Math.min(5, value)))
  const addRemark = () => {
    if (!onAnnotationsChange || annotations.length >= 50) return
    const id = annotationId()
    onAnnotationsChange([...annotations, { id, kind: 'remark', text: '', x: 0.1, y: 0.1, width: 0.35, height: 0.14 }])
    setSelectedAnnotation(id)
  }
  return (
    <Box
      sx={{
        height: '76vh',
        minHeight: 300,
        display: 'flex',
        flexDirection: 'column',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Stack direction='row' spacing={1} alignItems='center'>
          <Typography variant='body2'>Page {pageNumber}</Typography>
          {onAnnotationsChange && (
            <>
              <Tooltip title='Add a remark visible only in the editor'>
                <span><Button size='small' disabled={!page || imageBusy || annotations.length >= 50}
                  startIcon={<i className='tabler-note' />} onClick={addRemark}>Remark</Button></span>
              </Tooltip>
              <Tooltip title='Upload an E-stamp image to include in the saved PDF'>
                <span><Button size='small' disabled={!page || imageBusy || annotations.length >= 50}
                  startIcon={<i className='tabler-photo-plus' />} onClick={() => imageInput.current?.click()}>
                  {imageBusy ? 'Loading…' : 'E-stamp'}
                </Button></span>
              </Tooltip>
              <input ref={imageInput} type='file' accept='image/png,image/jpeg' hidden
                onChange={async event => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (!file || !natural) return
                  setAnnotationError('')
                  setImageBusy(true)
                  onAnnotationBusyChange?.(true)
                  try {
                    const loaded = await loadEStampImage(file)
                    let width = 0.25, height = width * natural.width / natural.height * loaded.height / loaded.width
                    if (height > 0.4) { width *= 0.4 / height; height = 0.4 }
                    // Very narrow image ratios would make the handles unusable.
                    if (width < 0.01 || height < 0.01) throw new Error('Choose an E-stamp image with a less extreme aspect ratio.')
                    const id = annotationId()
                    onAnnotationsChange([...annotations, { id, kind: 'estamp', image: loaded.image,
                      x: 0.1, y: 0.1, width, height }])
                    setSelectedAnnotation(id)
                  } catch (cause) {
                    setAnnotationError(cause instanceof Error ? cause.message : 'Could not load E-stamp image.')
                  } finally { setImageBusy(false); onAnnotationBusyChange?.(false) }
                }} />
            </>
          )}
        </Stack>
        <Stack direction='row' spacing={1} alignItems='center'>
          <Tooltip title='Zoom out'>
            <span>
              <IconButton
                size='small'
                aria-label='Zoom out'
                disabled={!page || scale <= 0.1}
                onClick={() => zoomTo(scale / 1.25)}
              >
                <i className='tabler-minus' />
              </IconButton>
            </span>
          </Tooltip>
          <Typography variant='body2' sx={{ minWidth: 48, textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </Typography>
          <Tooltip title='Zoom in'>
            <span>
              <IconButton
                size='small'
                aria-label='Zoom in'
                disabled={!page || scale >= 5}
                onClick={() => zoomTo(scale * 1.25)}
              >
                <i className='tabler-plus' />
              </IconButton>
            </span>
          </Tooltip>
          <Button
            size='small'
            variant={zoom === null ? 'tonal' : 'text'}
            disabled={!page}
            onClick={() => {
              setZoom(null)
              viewport.current?.scrollTo(0, 0)
            }}
          >
            Fit to page
          </Button>
        </Stack>
      </Stack>
      {annotationError && <Alert severity='error' onClose={() => setAnnotationError('')}>{annotationError}</Alert>}
      <Box
        ref={viewport}
        tabIndex={0}
        role='region'
        aria-label={`Preview page ${pageNumber}. Drag to pan when zoomed in.`}
        onDragStart={event => event.preventDefault()}
        onPointerDown={event => {
          if (event.button !== 0 || !viewport.current || !page) return
          const node = viewport.current
          setSelectedAnnotation(null)
          if (node.scrollWidth <= node.clientWidth && node.scrollHeight <= node.clientHeight) return
          pan.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            left: node.scrollLeft,
            top: node.scrollTop
          }
          node.setPointerCapture(event.pointerId)
          setDragging(true)
          event.preventDefault()
        }}
        onPointerMove={event => {
          const start = pan.current,
            node = viewport.current
          if (!start || start.id !== event.pointerId || !node) return
          node.scrollLeft = start.left - (event.clientX - start.x)
          node.scrollTop = start.top - (event.clientY - start.y)
        }}
        onPointerUp={event => {
          pan.current = null
          setDragging(false)
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId)
        }}
        onPointerCancel={() => {
          pan.current = null
          setDragging(false)
        }}
        onLostPointerCapture={event => {
          if (event.target !== event.currentTarget) return
          pan.current = null
          setDragging(false)
        }}
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          position: 'relative',
          bgcolor: 'grey.800',
          cursor: previewCursor,
          '& *': { cursor: 'inherit' },
          touchAction: 'none',
          userSelect: 'none'
        }}
      >
        {(dragPosition || resizePreview || dragging) && (
          <GlobalStyles styles={{ '*, *::before, *::after': { cursor: `${previewCursor} !important` } }} />
        )}
        {error ? (
          <Alert
            severity='error'
            sx={{ m: 2 }}
            action={<Button onClick={() => setRetry(value => value + 1)}>Retry</Button>}
          >
            {error}
          </Alert>
        ) : (
          <Box
            sx={{
              minWidth: '100%',
              minHeight: '100%',
              width: 'max-content',
              height: 'max-content',
              p: '16px',
              boxSizing: 'border-box',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <Box
              ref={stampSurface}
              sx={{
                width: dimensions?.width ?? 0,
                height: dimensions?.height ?? 0,
                bgcolor: 'common.white',
                overflow: 'hidden',
                boxShadow: 3,
                position: 'relative'
              }}
            >
              <canvas
                ref={canvas}
                aria-label={`Document page ${pageNumber}`}
                style={{
                  width: dimensions?.width,
                  height: dimensions?.height,
                  display: 'block',
                  pointerEvents: 'none',
                  transform: `rotate(${-visualDeskew}deg)`
                }}
              />
              {dimensions && (
                <PageAnnotationLayer annotations={annotations} width={dimensions.width} height={dimensions.height}
                  scale={scale} cursor={previewCursor} selectedId={selectedAnnotation} onSelect={setSelectedAnnotation}
                  onChange={onAnnotationsChange} />
              )}
              {stamp && page && (
                <Box
                  role={onStampMove ? 'button' : undefined}
                  tabIndex={onStampMove ? 0 : undefined}
                  aria-label={onStampMove ? 'Drag document name stamp' : 'Document name stamp preview'}
                  title={onStampMove ? 'Drag to position the document name. Arrow keys also move it.' : undefined}
                  onPointerDown={event => {
                    if (!onStampMove || event.button !== 0) return
                    event.stopPropagation()
                    event.preventDefault()
                    const rect = event.currentTarget.getBoundingClientRect()
                    stampDrag.current = {
                      id: event.pointerId,
                      offset: { x: event.clientX - rect.left, y: event.clientY - rect.top },
                      coordinates: savedStampCoordinates
                    }
                    setDragPosition(savedStampCoordinates)
                    event.currentTarget.setPointerCapture(event.pointerId)
                  }}
                  onPointerMove={event => {
                    const drag = stampDrag.current,
                      surface = stampSurface.current
                    if (!drag || drag.id !== event.pointerId || !surface) return
                    event.stopPropagation()
                    drag.coordinates = stampFromPointer(
                      { x: event.clientX, y: event.clientY },
                      surface.getBoundingClientRect(),
                      drag.offset,
                      scale,
                      stampTextWidth,
                      stampFontSize
                    )
                    setDragPosition(drag.coordinates)
                  }}
                  onPointerUp={event => {
                    const drag = stampDrag.current
                    if (!drag || drag.id !== event.pointerId) return
                    event.stopPropagation()
                    stampDrag.current = null
                    onStampMove?.(drag.coordinates)
                    setDragPosition(null)
                    if (event.currentTarget.hasPointerCapture(event.pointerId))
                      event.currentTarget.releasePointerCapture(event.pointerId)
                  }}
                  onPointerCancel={event => {
                    event.stopPropagation()
                    stampDrag.current = null
                    setDragPosition(null)
                  }}
                  onLostPointerCapture={() => {
                    stampDrag.current = null
                    setDragPosition(null)
                  }}
                  onKeyDown={event => {
                    if (!onStampMove || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
                    event.preventDefault()
                    event.stopPropagation()
                    const step = event.shiftKey ? 0.05 : 0.01
                    onStampMove({
                      x: Math.max(
                        0,
                        Math.min(
                          1,
                          savedStampCoordinates.x +
                            (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0)
                        )
                      ),
                      y: Math.max(
                        0,
                        Math.min(
                          1,
                          savedStampCoordinates.y +
                            (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0)
                        )
                      )
                    })
                  }}
                  sx={{
                    position: 'absolute',
                    left: stampLeft,
                    top: stampTop,
                    color: 'common.black',
                    whiteSpace: 'nowrap',
                    pointerEvents: onStampMove ? 'auto' : 'none',
                    cursor: previewCursor,
                    touchAction: 'none',
                    userSelect: 'none',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: stampFontSize * scale,
                    lineHeight: 1,
                    outline: onStampMove ? '1px dashed' : 'none',
                    outlineColor: 'primary.main',
                    outlineOffset: 3,
                    '&::before': onStampMove ? { content: '""', position: 'absolute', inset: '-8px' } : undefined
                  }}
                >
                  {stamp.name}
                  {onStampSizeChange && onStampMove && [
                    { x: -1, y: -1, label: 'top left' },
                    { x: 1, y: -1, label: 'top right' },
                    { x: -1, y: 1, label: 'bottom left' },
                    { x: 1, y: 1, label: 'bottom right' }
                  ].map(corner => (
                    <Box
                      key={corner.label}
                      component='span'
                      role='slider'
                      tabIndex={0}
                      aria-label={`Resize stamp from ${corner.label}`}
                      aria-valuemin={6}
                      aria-valuemax={48}
                      aria-valuenow={stampFontSize}
                      aria-valuetext={`${stampFontSize} pt`}
                      title={`Drag to resize · ${stampFontSize} pt`}
                      onPointerDown={event => {
                        event.stopPropagation()
                        event.preventDefault()
                        if (event.button !== 0) return
                        const preview = { fontSize: stampFontSize, coordinates: placedStamp }
                        resizeDrag.current = {
                          id: event.pointerId, x: event.clientX, y: event.clientY,
                          fontSize: stampFontSize, textWidth: stampTextWidth,
                          left: stampLeft / scale, top: stampTop / scale, corner, preview
                        }
                        setResizePreview(preview)
                        event.currentTarget.setPointerCapture(event.pointerId)
                      }}
                      onPointerMove={event => {
                        event.stopPropagation()
                        const drag = resizeDrag.current
                        if (!drag || drag.id !== event.pointerId || !natural) return
                        drag.preview = resizeStamp(
                          drag,
                          { x: (event.clientX - drag.x) / scale, y: (event.clientY - drag.y) / scale },
                          drag.corner, natural
                        )
                        setResizePreview(drag.preview)
                      }}
                      onPointerUp={event => {
                        event.stopPropagation()
                        const drag = resizeDrag.current
                        if (!drag || drag.id !== event.pointerId) return
                        resizeDrag.current = null
                        onStampSizeChange(drag.preview.fontSize, drag.preview.coordinates)
                        setResizePreview(null)
                        if (event.currentTarget.hasPointerCapture(event.pointerId))
                          event.currentTarget.releasePointerCapture(event.pointerId)
                      }}
                      onPointerCancel={event => {
                        event.stopPropagation()
                        resizeDrag.current = null
                        setResizePreview(null)
                      }}
                      onLostPointerCapture={event => {
                        event.stopPropagation()
                        resizeDrag.current = null
                        setResizePreview(null)
                      }}
                      onKeyDown={event => {
                        event.stopPropagation()
                        if (!['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
                        event.preventDefault()
                        const step = event.shiftKey ? 2 : 0.5
                        const next = event.key === 'Home' ? 6 : event.key === 'End' ? 48 :
                          stampFontSize + (['ArrowUp', 'ArrowRight'].includes(event.key) ? step : -step)
                        onStampSizeChange(Math.max(6, Math.min(48, next)))
                      }}
                      sx={{
                        position: 'absolute',
                        ...(corner.x < 0 ? { left: -5 } : { right: -5 }),
                        ...(corner.y < 0 ? { top: -5 } : { bottom: -5 }),
                        width: 10, height: 10, zIndex: 1,
                        bgcolor: 'common.white', border: '2px solid', borderColor: 'primary.main',
                        borderRadius: '2px', cursor: previewCursor, touchAction: 'none',
                        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 }
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}
        {loading && !error && (
          <Box sx={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, pointerEvents: 'none' }}>
            <CircularProgress size={24} sx={{ color: 'common.white' }} />
          </Box>
        )}
      </Box>
    </Box>
  )
}
