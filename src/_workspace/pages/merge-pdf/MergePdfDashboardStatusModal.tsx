import { forwardRef, type ReactElement, type Ref } from 'react'

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Slide,
  Stack,
  Typography,
  type SlideProps
} from '@mui/material'
import dayjs from 'dayjs'

import { useMergePdfDashboardStatusJobs } from '@/_workspace/react-query/hooks/useMergePdf'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

type DashboardStatus = 'DRAFT' | 'COMPLETED'

const Transition = forwardRef(function Transition(props: SlideProps & { children?: ReactElement }, ref: Ref<unknown>) {
  return <Slide direction='up' ref={ref} {...props} />
})

interface Props {
  open: boolean
  status: DashboardStatus | null
  from: string | null
  to: string | null
  createdBy: string
  updatedFrom: string | null
  updatedTo: string | null
  updatedBy: string
  onOpen: (jobId: number) => void
  onClose: () => void
}

const MergePdfDashboardStatusModal = ({
  open,
  status,
  from,
  to,
  createdBy,
  updatedFrom,
  updatedTo,
  updatedBy,
  onOpen,
  onClose
}: Props) => {
  const { data, isLoading, isError } = useMergePdfDashboardStatusJobs(
    from,
    to,
    createdBy.trim(),
    updatedFrom,
    updatedTo,
    updatedBy.trim(),
    status
  )
  const response = data?.data
  const jobs = response?.Status ? response.ResultOnDb : []
  const hasError = isError || (response !== undefined && !response.Status)
  const statusLabel = status === 'DRAFT' ? 'Draft' : 'Completed'

  const handleOpen = (jobId: number) => {
    onClose()
    onOpen(jobId)
  }

  return (
    <Dialog
      maxWidth='sm'
      fullWidth
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick') onClose()
      }}
      TransitionComponent={Transition}
      open={open}
      keepMounted
      sx={{
        '& .MuiDialog-paper': { overflow: 'visible' },
        '& .MuiDialog-container': { justifyContent: 'center', alignItems: 'flex-start' }
      }}
      PaperProps={{ sx: { top: 30, m: 0 } }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span' color='primary'>
          Combination Document Numbers |
        </Typography>
        <Typography variant='h5' component='span'>
          {' '}
          {statusLabel}
        </Typography>
        <DialogCloseButton onClick={onClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
          Created: {from ?? 'Any date'} – {to ?? 'Any date'} · Updated: {updatedFrom ?? 'Any date'} –{' '}
          {updatedTo ?? 'Any date'}
        </Typography>
        {(from && to && from > to) || (updatedFrom && updatedTo && updatedFrom > updatedTo) ? (
          <Alert severity='info' variant='outlined'>
            Select a valid date range.
          </Alert>
        ) : isLoading ? (
          <Typography variant='body2' color='text.secondary' align='center' sx={{ py: 2 }}>
            Loading document numbers...
          </Typography>
        ) : hasError ? (
          <Alert severity='error' variant='outlined'>
            Unable to load document numbers.
          </Alert>
        ) : jobs.length > 0 ? (
          <Stack divider={<Divider flexItem />} spacing={0} sx={{ maxHeight: 360, overflowY: 'auto' }}>
            {jobs.map(job => (
              <Stack key={job.JOB_ID} direction='row' alignItems='center' spacing={1} sx={{ px: 1, py: 0.75 }}>
                <Stack sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant='body2' fontWeight={600} noWrap>
                    {job.JOB_TITLE}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {dayjs(job.CREATE_DATE).format('DD-MMM-YYYY HH:mm')} · {job.DOCUMENT_COUNT} source files
                  </Typography>
                </Stack>
                <Button size='small' onClick={() => handleOpen(job.JOB_ID)}>
                  Open
                </Button>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography variant='body2' color='text.secondary' align='center' sx={{ py: 2 }}>
            No data found
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant='tonal' color='secondary'>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MergePdfDashboardStatusModal
