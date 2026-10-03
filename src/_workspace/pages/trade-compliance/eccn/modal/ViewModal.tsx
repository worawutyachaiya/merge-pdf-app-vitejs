import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Slide,
  SlideProps,
  Typography
} from '@mui/material'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@/components/mui/TextField'
import StatusColumn from '@/libs/material-react-table/components/StatusOption'
import { useEccnHsCodeRelations } from '@/_workspace/react-query/hooks/useEccn'
import type { EccnI } from '@/_workspace/types/trade-compliance/Eccn'
import { forwardRef, type ReactElement, type Ref } from 'react'

const Transition = forwardRef(function Transition(props: SlideProps & { children?: ReactElement }, ref: Ref<unknown>) {
  return <Slide direction='up' ref={ref} {...props} />
})

interface ViewModalProps {
  open: boolean
  data: EccnI | null
  onClose: () => void
}

const ViewModal = ({ open, data, onClose }: ViewModalProps) => {
  const { data: relationData, isError, isLoading } = useEccnHsCodeRelations(data?.ECCN_ID ?? null, open)
  const relations = relationData?.data.ResultOnDb ?? []

  return (
    <Dialog
      maxWidth='xs'
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
          View ECCN
        </Typography>
        <DialogCloseButton onClick={onClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <CustomTextField fullWidth disabled label='ECCN Code' value={data?.ECCN_CODE ?? ''} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <CustomTextField fullWidth disabled label='ECCN Sub Code' value={data?.ECCN_SUB_CODE || '-'} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <CustomTextField fullWidth disabled label='ECCN Full Code' value={data?.ECCN_FULL_CODE ?? ''} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              disabled
              label='Status'
              value={StatusColumn.find(status => status.value === data?.INUSE)?.label ?? ''}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              disabled
              label='HS Code'
              value={isLoading ? 'Loading...' : isError ? '-' : relations.length > 0 ? relations.map(relation => relation.HS_CODE).join(', ') : '-'}
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
}

export default ViewModal
