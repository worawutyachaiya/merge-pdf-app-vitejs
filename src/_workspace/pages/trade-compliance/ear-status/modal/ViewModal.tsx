import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@/components/mui/TextField'
import StatusColumn from '@/libs/material-react-table/components/StatusOption'
import type { EarStatusI } from '@/_workspace/types/trade-compliance/EarStatus'

interface ViewModalProps {
  open: boolean
  data: EarStatusI | null
  onClose: () => void
}

const ViewModal = ({ open, data, onClose }: ViewModalProps) => (
  <Dialog
    maxWidth='sm'
    fullWidth
    open={open}
    onClose={(_, reason) => reason !== 'backdropClick' && onClose()}
    sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
  >
    <DialogTitle>
      <Typography variant='h5' component='span'>
        View EAR Status
      </Typography>
      <DialogCloseButton onClick={onClose} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
    </DialogTitle>
    <DialogContent>
      <Grid container spacing={4}>
        <Grid size={12}>
          <CustomTextField fullWidth disabled label='EAR Status Code' value={data?.EAR_SURVEY_STATUS_CODE ?? ''} />
        </Grid>
        <Grid size={12}>
          <CustomTextField fullWidth disabled label='EAR Status' value={data?.EAR_SURVEY_STATUS_NAME ?? ''} />
        </Grid>
        <Grid size={12}>
          <CustomTextField
            fullWidth
            disabled
            label='Status'
            value={StatusColumn.find(status => status.value === data?.INUSE)?.label ?? ''}
          />
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

export default ViewModal
