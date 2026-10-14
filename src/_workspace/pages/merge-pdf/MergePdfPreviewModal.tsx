import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography
} from '@mui/material'

import { useMergePdfDetail, useMergePdfPublicationPreview } from '@/_workspace/react-query/hooks/useMergePdf'
import type { MergePdfJob } from '@/_workspace/types/merge-pdf/MergePdf'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import CustomTextField from '@/components/mui/TextField'
import Transition from '@/components/TransitionDialog'
import { ToastMessageError, ToastMessageSuccess } from '@/components/ToastMessage'

import { useObjectUrl } from './useObjectUrl'

interface Props {
  open: boolean
  job: MergePdfJob | null
  onClose: () => void
}

const MergePdfPreviewModal = ({ open, job, onClose }: Props) => {
  const detailQuery = useMergePdfDetail(open ? (job?.JOB_ID ?? null) : null)
  const detail = detailQuery.data?.data.ResultOnDb[0]
  const publication = detail?.publications.find(item => item.STATUS === 'PUBLISHED')
  const previewQuery = useMergePdfPublicationPreview(
    open ? (job?.JOB_ID ?? null) : null,
    publication?.PUBLICATION_ID ?? null
  )
  const previewUrl = useObjectUrl(open ? previewQuery.data : undefined)
  const filePath = publication?.NETWORK_PATH ?? job?.NETWORK_PATH

  const copyPath = async () => {
    if (!filePath) return
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(filePath)
      else {
        const input = document.getElementById('merge-pdf-shared-path') as HTMLInputElement | null
        input?.select()
        if (!input || !document.execCommand('copy')) throw new Error('Select the path and press Ctrl+C to copy it')
      }
      ToastMessageSuccess({ message: 'Path copied. Paste it into Windows File Explorer to open the PDF.' })
    } catch {
      const input = document.getElementById('merge-pdf-shared-path') as HTMLInputElement | null
      input?.select()
      ToastMessageError({ message: 'Select the path and press Ctrl+C, then paste it into File Explorer.' })
    }
  }

  return (
    <Dialog
      maxWidth='lg'
      fullWidth
      open={open}
      TransitionComponent={Transition}
      onClose={(_, reason) => reason !== 'backdropClick' && onClose()}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {publication?.OUTPUT_FILE_NAME ?? job?.JOB_TITLE ?? 'View PDF'}
        </Typography>
        <DialogCloseButton onClick={onClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Typography>{detail?.job.JOB_TITLE ?? job?.JOB_TITLE}</Typography>
          {filePath && (
            <Box>
              <CustomTextField
                id='merge-pdf-shared-path'
                label='PDF path'
                fullWidth
                value={filePath}
                slotProps={{ input: { readOnly: true } }}
                onFocus={event => event.target.select()}
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                <Button variant='outlined' onClick={() => void copyPath()}>
                  Copy path
                </Button>
                {previewUrl && (
                  <Button component='a' href={previewUrl} download={publication?.OUTPUT_FILE_NAME} variant='outlined'>
                    Download
                  </Button>
                )}
              </Box>
            </Box>
          )}
          {(detailQuery.isLoading || previewQuery.isLoading) && (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          )}
          {(detailQuery.isError || previewQuery.isError) && (
            <Alert
              severity='error'
              action={
                <Button
                  color='inherit'
                  onClick={() => {
                    void detailQuery.refetch()
                    if (publication) void previewQuery.refetch()
                  }}
                >
                  Retry
                </Button>
              }
            >
              Could not load the saved PDF.
            </Alert>
          )}
          {previewUrl && (
            <Box
              component='iframe'
              src={previewUrl}
              title={publication?.OUTPUT_FILE_NAME ?? 'Saved PDF preview'}
              sx={{ width: '100%', height: '70vh', border: 0, borderRadius: 1 }}
            />
          )}
          {!detailQuery.isLoading && !detailQuery.isError && detail && !publication && (
            <Typography color='text.secondary'>This document has not been completed yet.</Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant='tonal' color='secondary' onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MergePdfPreviewModal
