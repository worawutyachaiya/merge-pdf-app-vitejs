import { Box, CircularProgress, Typography } from '@mui/material'

import { useMergePdfPageThumbnail } from '@/_workspace/react-query/hooks/useMergePdf'

import { useObjectUrl } from './useObjectUrl'

interface Props {
  jobId: number
  pageId: number
  rotation: number
  enabled?: boolean
  label: string
}

const MergePdfPageThumbnail = ({ jobId, pageId, rotation, enabled = true, label }: Props) => {
  const query = useMergePdfPageThumbnail(jobId, pageId, rotation, enabled)
  const url = useObjectUrl(enabled ? query.data : undefined)

  if (url) {
    return (
      <Box
        component='img'
        alt={label}
        src={url}
        sx={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
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
