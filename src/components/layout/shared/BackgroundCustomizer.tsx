import { useEffect, useRef, useState, type ChangeEvent } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useBackgroundStore } from '@/libs/zustand/stores/useBackgroundStore'
import SeasonalThemeCustomizer from './SeasonalThemeCustomizer'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 2560
const WEBP_QUALITY = 0.86
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Unable to optimize the selected image.'))),
      'image/webp',
      WEBP_QUALITY
    )
  })

const optimizeImage = async (file: File): Promise<Blob> => {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Please select a JPG, PNG or WebP image.')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('The image must not exceed 5 MB.')
  }

  let image: ImageBitmap

  try {
    image = await createImageBitmap(file)
  } catch {
    throw new Error('The selected file is not a valid image.')
  }

  try {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height))
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) throw new Error('Image optimization is unavailable in this browser.')

    canvas.width = width
    canvas.height = height
    context.drawImage(image, 0, 0, width, height)

    return await canvasToBlob(canvas)
  } finally {
    image.close()
  }
}

const BackgroundCustomizer = () => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const pendingPreviewUrlRef = useRef<string | null>(null)
  const [pendingImage, setPendingImage] = useState<Blob | null>(null)
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const { imageUrl, shading, isLoading, isSaving, error, saveBackground, setShading, persistShading, resetBackground } =
    useBackgroundStore()

  const clearPendingImage = () => {
    if (pendingPreviewUrlRef.current) URL.revokeObjectURL(pendingPreviewUrlRef.current)

    pendingPreviewUrlRef.current = null
    setPendingPreviewUrl(null)
    setPendingImage(null)

    if (inputRef.current) inputRef.current.value = ''
  }

  useEffect(
    () => () => {
      if (pendingPreviewUrlRef.current) URL.revokeObjectURL(pendingPreviewUrlRef.current)
    },
    []
  )

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    setValidationError(null)
    setIsValidating(true)

    try {
      const optimizedImage = await optimizeImage(file)

      clearPendingImage()

      const previewUrl = URL.createObjectURL(optimizedImage)

      pendingPreviewUrlRef.current = previewUrl
      setPendingPreviewUrl(previewUrl)
      setPendingImage(optimizedImage)
    } catch (validationFailure) {
      clearPendingImage()
      setValidationError(
        validationFailure instanceof Error ? validationFailure.message : 'Unable to read the selected image.'
      )
    } finally {
      setIsValidating(false)
    }
  }

  const handleApply = async () => {
    if (!pendingImage) return

    try {
      await saveBackground(pendingImage)
      clearPendingImage()
    } catch {
      // The store exposes the storage error below.
    }
  }

  const handleReset = async () => {
    clearPendingImage()

    try {
      await resetBackground()
    } catch {
      // The store exposes the storage error below.
    }
  }

  const previewUrl = pendingPreviewUrl ?? imageUrl
  const isBusy = isLoading || isSaving || isValidating

  return (
    <Stack spacing={2.5}>
      <Box>
        <Stack direction='row' alignItems='center' justifyContent='space-between' spacing={2}>
          <Typography variant='subtitle2'>Background image</Typography>
          {imageUrl && (
            <Button
              variant='text'
              color='primary'
              size='small'
              disabled={isBusy}
              startIcon={<i className='tabler-restore text-base' />}
              onClick={handleReset}
              sx={{ minInlineSize: 'auto', whiteSpace: 'nowrap' }}
            >
              Reset background
            </Button>
          )}
        </Stack>
      </Box>

      <Box
        sx={{
          blockSize: 118,
          border: theme => `1px dashed ${theme.palette.divider}`,
          borderRadius: 1,
          bgcolor: 'action.hover',
          backgroundImage: previewUrl ? `url(${previewUrl})` : 'none',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden'
        }}
      >
        {!previewUrl && (
          <Typography variant='caption' color='text.secondary'>
            Default background
          </Typography>
        )}
      </Box>

      <Box>
        <Stack direction='row' justifyContent='space-between' alignItems='center'>
          <Typography variant='caption' color='text.secondary'>
            Background shading
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {shading}%
          </Typography>
        </Stack>
        <Slider
          size='small'
          min={0}
          max={80}
          value={shading}
          disabled={!previewUrl || isBusy}
          aria-label='Background shading'
          onChange={(_, value) => setShading(Array.isArray(value) ? value[0] : value)}
          onChangeCommitted={() => {
            void persistShading().catch(() => undefined)
          }}
        />
      </Box>

      {(validationError || error) && <Alert severity='error'>{validationError || error}</Alert>}

      <input ref={inputRef} hidden type='file' accept='image/jpeg,image/png,image/webp' onChange={handleImageChange} />

      <Stack direction='row' spacing={1}>
        <Button variant='contained' size='small' disabled={!pendingImage || isBusy} onClick={handleApply}>
          {isSaving && pendingImage ? <CircularProgress size={18} color='inherit' /> : 'Apply'}
        </Button>
        <Button variant='text' size='small' disabled={isBusy} onClick={() => inputRef.current?.click()}>
          Choose image...
        </Button>
      </Stack>

      <Typography variant='caption' color='text.secondary'>
        JPG, PNG or WebP, maximum 5 MB.
      </Typography>

      <Divider />
      <SeasonalThemeCustomizer />
    </Stack>
  )
}

export default BackgroundCustomizer
