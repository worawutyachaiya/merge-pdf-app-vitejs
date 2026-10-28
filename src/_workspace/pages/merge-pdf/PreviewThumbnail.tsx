import { useEffect, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import type { MergePdfPage } from '@/_workspace/types/merge-pdf/MergePdf'
import MergePdfPageThumbnail from './MergePdfPageThumbnail'

export default function PreviewThumbnail({ jobId, page, localImage, selected, onClick }: { jobId: number; page: MergePdfPage; localImage?: string; selected: boolean; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement | null>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(entries => setVisible(entries[0]?.isIntersecting ?? false), { rootMargin: '150px' })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return <Box component='button' ref={ref} type='button' onClick={onClick} aria-label={`View page ${page.SORT_ORDER}`}
    sx={{ cursor: 'pointer', background: 'transparent', border: 1, borderColor: selected ? 'primary.main' : 'divider', borderRadius: 1, p: 1 }}>
    <Box sx={{ height: 110, display: 'flex', justifyContent: 'center' }}>
      <MergePdfPageThumbnail jobId={jobId} pageId={page.PAGE_ID} rotation={page.ROTATION_DEGREES} deskew={page.DESKEW_DEGREES ?? 0} enabled={visible} localImage={localImage} label={`Page ${page.SORT_ORDER}`} />
    </Box>
    <Typography variant='caption'>{page.SORT_ORDER}</Typography>
  </Box>
}
