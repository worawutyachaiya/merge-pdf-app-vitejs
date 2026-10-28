import { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import { useMergePdfPageThumbnail } from '@/_workspace/react-query/hooks/useMergePdf'
import { useObjectUrl } from './useObjectUrl'

interface Props {
  jobId: number
  pageId: number
  rotation: number
  pageNumber: number
  previewUrl: string
  localImage?: string
}

// Edge does not reliably honor view=Fit. Choose the supported height/width fit
// according to the page and viewer aspect ratios so the entire page is visible.
export default function FitPagePreview({ jobId, pageId, rotation, pageNumber, previewUrl, localImage }: Props) {
  const frame = useRef<HTMLDivElement | null>(null)
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 })
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null)
  const thumbnail = useMergePdfPageThumbnail(jobId, pageId, rotation, !localImage && pageId > 0)
  const thumbnailUrl = useObjectUrl(thumbnail.data)
  const imageUrl = localImage ? `data:image/png;base64,${localImage}` : thumbnailUrl

  useEffect(() => {
    const node = frame.current
    if (!node) return
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setFrameSize(previous => previous.width === width && previous.height === height ? previous : { width, height })
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setPageSize(null)
    if (!imageUrl) return
    const image = new Image()
    image.onload = () => {
      const swap = !!localImage && (rotation === 90 || rotation === 270)
      setPageSize({ width: swap ? image.naturalHeight : image.naturalWidth, height: swap ? image.naturalWidth : image.naturalHeight })
    }
    image.src = imageUrl
    return () => { image.onload = null }
  }, [imageUrl, localImage, rotation])

  const availableHeight = Math.max(1, frameSize.height - 60)
  const fit = pageSize && frameSize.width > 0 && pageSize.width / pageSize.height > frameSize.width / availableHeight ? 'FitH' : 'FitV'

  return <Box ref={frame} sx={{ position: 'relative', width: '100%', height: '76vh', border: '1px solid', borderColor: 'divider' }}>
    <Box component='iframe' title={`Preview page ${pageNumber}`} src={`${previewUrl}#toolbar=1&navpanes=0&view=${fit}`}
      sx={{ display: 'block', width: '100%', height: '100%', border: 0 }} />
  </Box>
}
