import { Box, CircularProgress, Typography } from '@mui/material'

import { useMergePdfPageThumbnail } from '@/_workspace/react-query/hooks/useMergePdf'

import { useObjectUrl } from './useObjectUrl'

interface Props {
  jobId: number
  pageId: number
  rotation: number
  enabled?: boolean
  label: string
  localImage?: string
}

const MergePdfPageThumbnail = ({ jobId, pageId, rotation, enabled = true, label, localImage }: Props) => {
  const query = useMergePdfPageThumbnail(jobId, pageId, rotation, enabled && pageId > 0)
  const fetchedUrl = useObjectUrl(enabled ? query.data : undefined)
  const url = localImage ? `data:image/png;base64,${localImage}` : fetchedUrl

  if (url) {
    return (
      <Box
        component='img'
        alt={label}
        src={url}
        draggable={false}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          transform: localImage ? `rotate(${rotation}deg)` : undefined
        }}
      />
    )
  }
  if (query.isError) {
    return (
      <Typography variant='caption' color='error'>
        Preview unavailable
      </Typography>
    )
  }
  return enabled ? (
    <CircularProgress size={24} aria-label={`Loading ${label}`} />
  ) : (
    <i className='tabler-file-type-pdf text-4xl' />
  )
}

export default MergePdfPageThumbnail
