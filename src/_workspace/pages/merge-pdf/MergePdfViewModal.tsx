import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography
} from '@mui/material'

import type { MergePdfJob } from '@/_workspace/types/merge-pdf/MergePdf'
import { useMergePdfDetail } from '@/_workspace/react-query/hooks/useMergePdf'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import CustomTextField from '@/components/mui/TextField'
import Transition from '@/components/TransitionDialog'
import DocumentStatusIndicator from './DocumentStatusIndicator'
import { documentStatusColumns } from './documentStatus'

interface Props {
  open: boolean
  job: MergePdfJob | null
  onClose: () => void
}

const MergePdfViewModal = ({ open, job, onClose }: Props) => {
  const detailQuery = useMergePdfDetail(open ? (job?.JOB_ID ?? null) : null)
  const currentJob = detailQuery.data?.data.ResultOnDb[0]?.job ?? job
  return (
    <Dialog
      maxWidth='sm'
      fullWidth
      open={open}
      TransitionComponent={Transition}
      onClose={(_, reason) => reason !== 'backdropClick' && onClose()}
      sx={{
        '& .MuiDialog-paper': { overflow: 'visible' },
        '& .MuiDialog-container': { justifyContent: 'center', alignItems: 'flex-start' }
      }}
      PaperProps={{ sx: { top: 30, m: 0 } }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          View Merge PDF
        </Typography>
        <DialogCloseButton onClick={onClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={4}>
          <Grid size={12}>
            <CustomTextField fullWidth disabled label='Document Name' value={currentJob?.JOB_TITLE ?? ''} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              disabled
              label='Status'
              value={
                currentJob?.STATUS === 'COMPLETED'
                  ? 'Completed'
                  : currentJob?.STATUS === 'DRAFT'
                    ? 'Draft'
                    : 'Completing'
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <CustomTextField fullWidth disabled label='Files' value={currentJob?.DOCUMENT_COUNT ?? 0} />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <CustomTextField fullWidth disabled label='Pages' value={currentJob?.PAGE_COUNT ?? 0} />
          </Grid>
          <Grid size={12}>
            <CustomTextField
              fullWidth
              disabled
              label='Last Updated'
              value={currentJob ? new Date(currentJob.UPDATE_DATE).toLocaleString('en-GB') : ''}
            />
          </Grid>
          <Grid size={12}>
            <CustomTextField fullWidth disabled label='Update By' value={currentJob?.UPDATE_BY ?? ''} />
          </Grid>
          <Grid size={12}>
            <CustomTextField fullWidth disabled label='Created By' value={currentJob?.CREATE_BY ?? ''} />
          </Grid>
          <Grid size={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant='subtitle1'>สถานะเอกสาร</Typography>
              {detailQuery.isFetching && <CircularProgress size={18} />}
            </Box>
            {detailQuery.isError ? (
              <Alert
                severity='error'
                action={
                  <Button color='inherit' onClick={() => void detailQuery.refetch()}>
                    Retry
                  </Button>
                }
              >
                Could not load document status.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {documentStatusColumns.map(category => {
                  const count = currentJob?.DOCUMENT_PAGE_COUNTS?.[category.categoryId] ?? 0
                  return (
                    <Grid key={category.id} size={{ xs: 12, sm: 6 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 2
                        }}
                      >
                        <DocumentStatusIndicator
                          categoryId={category.categoryId}
                          name={category.name}
                          pageCount={currentJob?.DOCUMENT_PAGE_COUNTS ? count : undefined}
                        />
                        <Typography variant='body2' sx={{ flex: 1 }}>
                          {category.name}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {currentJob?.DOCUMENT_PAGE_COUNTS ? (count > 0 ? `${count} หน้า` : 'ยังไม่มี') : '…'}
                        </Typography>
                      </Box>
                    </Grid>
                  )
                })}
              </Grid>
            )}
            {!!currentJob?.UNCLASSIFIED_PAGE_COUNT && (
              <Typography variant='body2' color='text.secondary' sx={{ mt: 3 }}>
                ยังไม่ได้ระบุประเภท {currentJob.UNCLASSIFIED_PAGE_COUNT} หน้า
              </Typography>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant='tonal' color='secondary' onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MergePdfViewModal
