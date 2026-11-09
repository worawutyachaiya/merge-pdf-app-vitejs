import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import MergePdfServices from '@/_workspace/services/merge-pdf/MergePdfServices'
import type { MergePdfJob } from '@/_workspace/types/merge-pdf/MergePdf'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import Transition from '@/components/TransitionDialog'
import { useObjectUrl } from './useObjectUrl'

interface Props {
  job: MergePdfJob
  categoryId: number
  categoryName: string
  onClose: () => void
}

export default function CategoryPdfPreviewModal({ job, categoryId, categoryName, onClose }: Props) {
  const query = useQuery({
    queryKey: ['MERGE_PDF', 'category-preview', job.JOB_ID, job.ROW_VERSION, categoryId],
    queryFn: async ({ signal }) => (await MergePdfServices.categoryPdf(job.JOB_ID, categoryId, signal)).data,
    staleTime: 300_000
  })
  const url = useObjectUrl(query.data)
  const filename = `${job.JOB_CODE}-${categoryName.replace(/[^\p{L}\p{N} ._-]/gu, '')}.pdf`
  return (
    <Dialog
      open fullWidth maxWidth='lg'
      TransitionComponent={Transition}
      onClose={(_, reason) => reason !== 'backdropClick' && onClose()}
      sx={{
        '& .MuiDialog-paper': { overflow: 'visible' },
        '& .MuiDialog-container': { justifyContent: 'center', alignItems: 'flex-start' }
      }}
      PaperProps={{ sx: { top: 30, m: 0 } }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>{job.JOB_TITLE} · {categoryName}</Typography>
        <DialogCloseButton onClick={onClose} aria-label='Close document preview' disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          {url && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Button component='a' href={url} download={filename} variant='outlined'>Download</Button>
            </Box>
          )}
          {query.isLoading && (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          )}
          {query.isError && (
            <Alert severity='error' action={<Button onClick={() => void query.refetch()}>Retry</Button>}>
              Could not load this document.
            </Alert>
          )}
          {url && (
            <Box component='iframe' src={url} title={categoryName} sx={{ width: '100%', height: '70vh', border: 0, borderRadius: 1 }} />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant='tonal' color='secondary' onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
