import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material'

import type { MergePdfJob } from '@/_workspace/types/merge-pdf/MergePdf'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import CustomTextField from '@/components/mui/TextField'
import Transition from '@/components/TransitionDialog'

interface Props {
  open: boolean
  job: MergePdfJob | null
  onClose: () => void
}

const MergePdfViewModal = ({ open, job, onClose }: Props) => (
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
          <CustomTextField fullWidth disabled label='Document Name' value={job?.JOB_TITLE ?? ''} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomTextField
            fullWidth
            disabled
            label='Status'
            value={job?.STATUS === 'COMPLETED' ? 'Completed' : job?.STATUS === 'DRAFT' ? 'Draft' : 'Completing'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <CustomTextField fullWidth disabled label='Files' value={job?.DOCUMENT_COUNT ?? 0} />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <CustomTextField fullWidth disabled label='Pages' value={job?.PAGE_COUNT ?? 0} />
        </Grid>
        <Grid size={12}>
          <CustomTextField
            fullWidth
            disabled
            label='Last Updated'
            value={job ? new Date(job.UPDATE_DATE).toLocaleString('en-GB') : ''}
          />
        </Grid>
        <Grid size={12}>
          <CustomTextField fullWidth disabled label='Update By' value={job?.UPDATE_BY ?? ''} />
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

export default MergePdfViewModal
