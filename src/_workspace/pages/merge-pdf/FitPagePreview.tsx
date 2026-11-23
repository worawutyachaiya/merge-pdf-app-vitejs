import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Box, Button, CircularProgress, GlobalStyles, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { getDocument, GlobalWorkerOptions, type PDFPageProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import {
  jobStampCoordinates,
  indexFont,
  indexTextWidth,
  resizeStamp,
  stampVerticalMetrics,
  stampCoordinatesAtOffset,
  stampOffset,
  type StampCoordinates
} from './stampPlacement'
import PageAnnotationLayer from './PageAnnotationLayer'
import TextFormattingControls, { AnnotationColor } from './TextFormattingControls'
import { annotationId, annotationLabels, duplicateCover, loadEStampImage, type CoverAnnotation, type PageAnnotation } from './pageAnnotations'
import { fontVariant, isSystemFont, loadLocalSystemFonts, usesCustomFont, type SystemFontAvailability, type TextStyle } from './textFormatting'
import MergePdfServices from '@/_workspace/services/merge-pdf/MergePdfServices'
import './pdfEditorFonts.css'

GlobalWorkerOptions.workerSrc = workerUrl

// Use one outlined cursor throughout the gesture; native grab/move cursors can
// disappear over the PDF canvas in Edge on Windows.
const previewCursor = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="28" viewBox="0 0 24 28"><path d="M3 2v21l5-5 4 8 4-2-4-8h8Z" fill="black" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>'
)}") 3 2, default`
const clampZoom = (value: number) => Math.max(0.1, Math.min(5, value))
const defaultStampStyle: TextStyle = {}

interface Props {
  previewUrl: string
  pageNumber: number
  visualDeskew?: number
  stamp?: { name: string; coordinates?: StampCoordinates; fontSize?: number; style?: TextStyle }
  onStampMove?: (coordinates: StampCoordinates) => void
  onStampSizeChange?: (fontSize: number, coordinates?: StampCoordinates) => void
  onStampStyleChange?: (fields: Partial<TextStyle>) => void
  annotations?: PageAnnotation[]
  coverClipboard: React.RefObject<CoverAnnotation | null>
  onAnnotationsChange?: (items: PageAnnotation[]) => void
  onAnnotationBusyChange?: (busy: boolean) => void
}

export default function FitPagePreview({ previewUrl, pageNumber, visualDeskew = 0, stamp, onStampMove, onStampSizeChange, onStampStyleChange, annotations = [], coverClipboard, onAnnotationsChange, onAnnotationBusyChange }: Props) {
  const root = useRef<HTMLDivElement | null>(null)
  const imageInput = useRef<HTMLInputElement | null>(null)
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null)
  const indexSelected = selectedAnnotation === 'index'
  const selected = annotations.find(item => item.id === selectedAnnotation)
  const [imageBusy, setImageBusy] = useState(false)
  const [annotationError, setAnnotationError] = useState('')
  const [resizePreview, setResizePreview] = useState<ReturnType<typeof resizeStamp> | null>(null)
  const resizeDrag = useRef<{
    id: number; x: number; y: number; fontSize: number; textWidth: number; left: number; top: number;
    corner: { x: number; y: number }; preview: ReturnType<typeof resizeStamp>
  } | null>(null)
  const stampFontSize = resizePreview?.fontSize ?? stamp?.fontSize ?? 10
  const stampStyle = stamp?.style ?? defaultStampStyle
  const hasSavedIndexFont = isSystemFont(stampStyle.fontFamily)
  const localFonts = useQuery({
    queryKey: ['MERGE_PDF', 'local-system-fonts'],
    queryFn: loadLocalSystemFonts,
    enabled: hasSavedIndexFont || annotations.some(item => item.kind === 'remark' && isSystemFont(item.fontFamily)),
    staleTime: Infinity,
    gcTime: Infinity
  })
  const serverFonts = useQuery({
    queryKey: ['MERGE_PDF', 'server-system-fonts'],
    queryFn: MergePdfServices.systemIndexFonts,
    enabled: hasSavedIndexFont,
    staleTime: 60_000,
    retry: false,
    meta: { suppressErrorToast: true }
  })
  const indexSystemFonts = useMemo<SystemFontAvailability>(() => Object.fromEntries(
    (serverFonts.data ?? []).map(({ family, variants }) => [
      family, variants.filter(variant => localFonts.data?.[family]?.includes(variant))
    ])
  ), [localFonts.data, serverFonts.data])
  const [indexFontLoad, setIndexFontLoad] = useState<{ font: string; loaded: boolean } | null>(null)
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const viewport = useRef<HTMLDivElement | null>(null)
  const stampSurface = useRef<HTMLDivElement | null>(null)
  const stampCanvas = useRef<HTMLCanvasElement | null>(null)
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
    const node = viewport.current
    if (!node) return
    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return
      event.preventDefault()
      if (!page || !event.deltaY) return
      const factor = event.deltaY < 0 ? 1.25 : 1 / 1.25
      setZoom(current => clampZoom((current ?? fitScale) * factor))
    }
    node.addEventListener('wheel', handleWheel, { passive: false })
    return () => node.removeEventListener('wheel', handleWheel)
  }, [page, fitScale])

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
  const stampName = stamp?.name ?? ''
  const customFont = usesCustomFont(stampStyle) ? indexFont(stampStyle, 16) : null
  const systemFamily = isSystemFont(stampStyle.fontFamily) ? stampStyle.fontFamily : null
  const systemVariant = fontVariant(stampStyle)
  const canLoadIndexFont = !systemFamily || !!localFonts.data?.[systemFamily]?.includes(systemVariant)
  const hasLoadedIndexFont = canLoadIndexFont && (!customFont || (indexFontLoad?.font === customFont && indexFontLoad.loaded))
  useEffect(() => {
    if (!customFont || !canLoadIndexFont) return
    let active = true
    void document.fonts.load(customFont, stampName).then(faces => {
      if (active) setIndexFontLoad({ font: customFont, loaded: faces.length > 0 })
    }).catch(() => {
      if (active) setIndexFontLoad({ font: customFont, loaded: false })
    })
    return () => { active = false }
  }, [customFont, stampName, canLoadIndexFont])
  const stampTextWidth = useMemo(
    () => stampName && hasLoadedIndexFont ? indexTextWidth(stampName, stampFontSize, stampStyle) : 0,
    [stampName, stampFontSize, stampStyle, hasLoadedIndexFont]
  )
  const userUnit = page?.userUnit ?? 1
  const stampScale = scale * userUnit
  const stampPage = { width: (natural?.width ?? 0) / userUnit, height: (natural?.height ?? 0) / userUnit }
  const stampPosition = stampOffset(placedStamp, stampPage, stampTextWidth, stampFontSize, stampStyle)
  const { baseline, height: stampHeight } = stampVerticalMetrics(stampFontSize, stampStyle)
  useEffect(() => {
    const node = stampCanvas.current
    if (!node || !stampTextWidth) return
    const density = Math.min(window.devicePixelRatio || 1, 2)
    node.width = Math.max(1, Math.ceil(stampTextWidth * stampScale * density))
    node.height = Math.max(1, Math.ceil(stampHeight * stampScale * density))
    const context = node.getContext('2d')
    if (!context) return
    context.font = indexFont(stampStyle, stampFontSize)
    context.fontKerning = 'none'
    context.textBaseline = 'alphabetic'
    const measuredWidth = context.measureText(stampName).width
    if (!measuredWidth) return
    context.scale(node.width / measuredWidth, node.height / stampHeight)
    const thickness = stampFontSize * 0.045
    context.fillStyle = stampStyle.color ?? '#000000'
    context.fillText(stampName, 0, baseline)
    if (stampStyle.underline) context.fillRect(0, baseline + stampFontSize * 0.065 - thickness / 2, measuredWidth, thickness)
    if (stampStyle.strikethrough) context.fillRect(0, baseline - stampFontSize * 0.28 - thickness / 2, measuredWidth, thickness)
  }, [page, stampName, stampScale, stampTextWidth, stampFontSize, stampHeight, baseline, stampStyle])

  useEffect(() => {
    const dialog = root.current?.closest<HTMLElement>('[role="dialog"]')
    if (!dialog || !page || !onAnnotationsChange || imageBusy) return
    const onShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing ||
        !(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return
      const target = event.target
      if (!(target instanceof HTMLElement) ||
        target.closest('[role="dialog"]') !== dialog ||
        target.isContentEditable || target.closest('input, textarea, select') || window.getSelection()?.toString()) return
      const key = event.key.toLowerCase()
      // The physical keys stay the same when the active layout is Thai.
      if ((event.code === 'KeyC' || key === 'c') && selected?.kind === 'cover') {
        event.preventDefault()
        coverClipboard.current = selected
      } else if ((event.code === 'KeyV' || key === 'v') && coverClipboard.current && annotations.length < 50) {
        event.preventDefault()
        if (event.repeat) return
        const copy = duplicateCover(coverClipboard.current, annotations)
        onAnnotationsChange([...annotations, copy])
        setSelectedAnnotation(copy.id)
      }
    }
    dialog.addEventListener('keydown', onShortcut, true)
    return () => dialog.removeEventListener('keydown', onShortcut, true)
  }, [annotations, coverClipboard, imageBusy, onAnnotationsChange, page, selected])

  const zoomTo = (value: number) => setZoom(clampZoom(value))
  const addRemark = () => {
    if (!onAnnotationsChange || annotations.length >= 50) return
    const id = annotationId()
    onAnnotationsChange([...annotations, { id, kind: 'remark', text: '', fontSize: 12, color: '#000000', x: 0.1, y: 0.1, width: 0.35, height: 0.14 }])
    setSelectedAnnotation(id)
  }
  const addCover = () => {
    if (!onAnnotationsChange || annotations.length >= 50) return
    const id = annotationId()
    onAnnotationsChange([...annotations, { id, kind: 'cover', color: '#ffffff', x: 0.4, y: 0.45, width: 0.2, height: 0.1 }])
    setSelectedAnnotation(id)
  }
  const updateSelected = (item: PageAnnotation) =>
    onAnnotationsChange?.(annotations.map(current => current.id === item.id ? item : current))
  const prepareTiffStamp = async (file: File): Promise<{ image: string; width: number; height: number }> => {
    if (file.size > 2 * 1024 * 1024) throw new Error('Choose a TIFF image up to 2 MB.')
    const response = await MergePdfServices.prepareEStampImage(file)
    if (!response.data.Status || !response.data.ResultOnDb[0])
      throw new Error(response.data.Message || 'Could not convert this TIFF image.')
    return response.data.ResultOnDb[0]
  }
  return (
    <Box
      ref={root}
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
        sx={{ p: 1.5, gap: 1, flexShrink: 0, overflowX: 'auto', borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Stack direction='row' spacing={1} alignItems='center' sx={{ flexShrink: 0 }}>
          <Typography variant='body2'>Page {pageNumber}</Typography>
          {stamp && (
            <Button
              size='small'
              variant={indexSelected ? 'tonal' : 'text'}
              aria-pressed={indexSelected}
              disabled={!page || !onStampStyleChange}
              onClick={() => setSelectedAnnotation(current => current === 'index' ? null : 'index')}
            >
              Index
            </Button>
          )}
          {onAnnotationsChange && (
            <>
              <Tooltip title='Add a remark visible only in the editor'>
                <span><Button size='small' disabled={!page || imageBusy || annotations.length >= 50}
                  startIcon={<i className='tabler-note' />} onClick={addRemark}>Remark</Button></span>
              </Tooltip>
              <Tooltip title='Upload a PNG, JPEG, or TIFF image to include in the saved PDF'>
                <span><Button size='small' disabled={!page || imageBusy || annotations.length >= 50}
                  startIcon={<i className='tabler-photo-plus' />} onClick={() => imageInput.current?.click()}>
                  {imageBusy ? 'Loading…' : 'E-stamp'}
                </Button></span>
              </Tooltip>
              <Tooltip title='Cover part of the saved PDF. Select a rectangle, then use Ctrl+C and Ctrl+V to copy and paste.'>
                <span><Button size='small' disabled={!page || imageBusy || annotations.length >= 50}
                  startIcon={<i className='tabler-square' />} onClick={addCover}>Cover rectangle</Button></span>
              </Tooltip>
              <input ref={imageInput} type='file' accept='image/png,image/jpeg,image/tiff,image/x-tiff,.tif,.tiff' hidden
                onChange={async event => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (!file || !natural) return
                  setAnnotationError('')
                  setImageBusy(true)
                  onAnnotationBusyChange?.(true)
                  try {
                    const isTiff = ['image/tiff', 'image/x-tiff'].includes(file.type.toLowerCase()) || /\.tiff?$/i.test(file.name)
                    const loaded = isTiff ? await prepareTiffStamp(file) : await loadEStampImage(file)
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
        {indexSelected && stamp && onStampStyleChange && onStampSizeChange && (
          <Stack direction='row' spacing={0.5} alignItems='center' role='group' aria-label='Index formatting'
            sx={{ flexShrink: 0, pl: 1, borderLeft: 1, borderColor: 'divider' }}>
            <TextFormattingControls
              key='index'
              style={stampStyle}
              size={stampFontSize}
              maxSize={48}
              systemFonts={indexSystemFonts}
              onStyleChange={onStampStyleChange}
              onSizeChange={onStampSizeChange}
            />
          </Stack>
        )}
        {selected && onAnnotationsChange && (
          <Stack direction='row' spacing={0.5} alignItems='center' role='group' aria-label={`${annotationLabels[selected.kind]} tools`}
            sx={{ flexShrink: 0, pl: 1, borderLeft: 1, borderColor: 'divider' }}>
            {selected.kind === 'remark' && (
              <TextFormattingControls
                key={selected.id}
                style={selected}
                size={selected.fontSize ?? 12}
                maxSize={72}
                systemFonts={localFonts.data ?? {}}
                onStyleChange={fields => updateSelected({ ...selected, ...fields })}
                onSizeChange={fontSize => updateSelected({ ...selected, fontSize })}
              />
            )}
            {selected.kind === 'cover' && (
              <AnnotationColor label='Fill color' color={selected.color} onChange={color => updateSelected({ ...selected, color })} />
            )}
            <Tooltip title={`Remove ${annotationLabels[selected.kind]}`}>
              <IconButton size='small' color='error' aria-label={`Remove ${annotationLabels[selected.kind]}`}
                onClick={() => {
                  onAnnotationsChange(annotations.filter(item => item.id !== selected.id))
                  setSelectedAnnotation(null)
                }}>
                <i className='tabler-trash' />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
        <Stack direction='row' spacing={1} alignItems='center' sx={{ flexShrink: 0, ml: 'auto' }}>
          <Tooltip title='Zoom out (Ctrl + scroll down)'>
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
          <Tooltip title='Zoom in (Ctrl + scroll up)'>
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
      {systemFamily && localFonts.isSuccess && !canLoadIndexFont && (
        <Alert severity='warning'>The selected index font is unavailable on this device.</Alert>
      )}
      {systemFamily && serverFonts.isSuccess && canLoadIndexFont && !indexSystemFonts[systemFamily]?.includes(systemVariant) && (
        <Alert severity='warning'>The selected index font cannot be embedded on the PDF server.</Alert>
      )}
      {canLoadIndexFont && customFont && indexFontLoad?.font === customFont && !indexFontLoad.loaded && (
        <Alert severity='warning'>Could not load the selected index font in the preview.</Alert>
      )}
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
                boxShadow: 3,
                position: 'relative'
              }}
            >
              <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
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
              </Box>
              {stamp && page && hasLoadedIndexFont && (
                <Box
                  role={onStampMove ? 'button' : undefined}
                  tabIndex={onStampMove ? 0 : undefined}
                  aria-label={onStampMove ? `Move document name stamp ${stampName}` : `Document name stamp ${stampName}`}
                  aria-pressed={onStampMove ? indexSelected : undefined}
                  title={onStampMove ? 'Drag to position the document name. Arrow keys also move it.' : undefined}
                  onFocus={() => setSelectedAnnotation('index')}
                  onPointerDown={event => {
                    if (!onStampMove || event.button !== 0) return
                    event.stopPropagation()
                    event.preventDefault()
                    setSelectedAnnotation('index')
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
                    const rect = surface.getBoundingClientRect()
                    drag.coordinates = stampCoordinatesAtOffset(
                      {
                        x: (event.clientX - rect.left - drag.offset.x) / stampScale,
                        y: (event.clientY - rect.top - drag.offset.y) / stampScale
                      },
                      stampPage,
                      stampTextWidth,
                      stampFontSize,
                      stampStyle
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
                    if (!onStampMove) return
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedAnnotation('index')
                      return
                    }
                    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
                    event.preventDefault()
                    event.stopPropagation()
                    const step = event.shiftKey ? 0.05 : 0.01
                    const x = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
                    const y = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
                    onStampMove(stampCoordinatesAtOffset({
                      x: stampPosition.x + x * stampPage.width,
                      y: stampPosition.y + y * stampPage.height
                    }, stampPage, stampTextWidth, stampFontSize, stampStyle))
                  }}
                  sx={{
                    position: 'absolute',
                    left: stampPosition.x * stampScale,
                    top: stampPosition.y * stampScale,
                    width: stampTextWidth * stampScale,
                    height: stampHeight * stampScale,
                    zIndex: 5,
                    pointerEvents: onStampMove ? 'auto' : 'none',
                    cursor: previewCursor,
                    touchAction: 'none',
                    userSelect: 'none',
                    outline: onStampMove && indexSelected ? '1px dashed' : 'none',
                    outlineColor: 'primary.main',
                    outlineOffset: 3,
                    '&::before': onStampMove ? { content: '""', position: 'absolute', inset: '-8px' } : undefined
                  }}
                >
                  <canvas ref={stampCanvas} aria-hidden='true' style={{ display: 'block', width: '100%', height: '100%' }} />
                  {onStampSizeChange && onStampMove && indexSelected && [
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
                          left: stampPosition.x, top: stampPosition.y, corner, preview
                        }
                        setResizePreview(preview)
                        event.currentTarget.setPointerCapture(event.pointerId)
                      }}
                      onPointerMove={event => {
                        event.stopPropagation()
                        const drag = resizeDrag.current
                        if (!drag || drag.id !== event.pointerId) return
                        drag.preview = resizeStamp(
                          drag,
                          { x: (event.clientX - drag.x) / stampScale, y: (event.clientY - drag.y) / stampScale },
                          drag.corner, stampPage, stampStyle
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
